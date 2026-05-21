import { Editor, type Extensions } from "@tiptap/core";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { createVizelExtensions } from "../extensions/base.ts";
import type { VizelSlashCommandItem } from "../extensions/slash-command.ts";
import type { VizelEditorOptions, VizelImageFeatureOptions } from "../types.ts";
import { resolveVizelFeatures, vizelDefaultEditorProps } from "./editorHelpers.ts";
import { createVizelError } from "./errorHandling.ts";
import { initializeVizelMarkdownContent } from "./markdown.ts";

/**
 * Re-apply the selection requested by the constructor's `autofocus` option
 * after `setContent` has overridden it. Tiptap's `setContent` always lands
 * the selection at the end of the new document and triggers `scrollIntoView`,
 * which we have to undo for cases where the consumer asked for "start", "all",
 * a numeric position, or no focus at all.
 */
/**
 * Validate collaboration-feature dependencies. Both `comments` and
 * `presence` lose meaning without an underlying provider distributing
 * their state; the editor refuses to construct rather than render
 * silently broken UI.
 */
function validateVizelCollaborationFeatures(features: VizelEditorOptions["features"]): void {
  const collaboration = features?.collaboration;
  if (!collaboration) return;
  const provider = collaboration.provider;

  if (collaboration.comments && !provider) {
    throw createVizelError(
      "INVALID_CONFIG",
      "features.collaboration.comments requires features.collaboration.provider to be set.",
      { context: { feature: "comments" } }
    );
  }
  if (collaboration.presence && !provider) {
    throw createVizelError(
      "INVALID_CONFIG",
      "features.collaboration.presence requires features.collaboration.provider to be set.",
      { context: { feature: "presence" } }
    );
  }
}

function applyInitialSelection(editor: Editor, autofocus: VizelEditorOptions["autofocus"]): void {
  const docSize = editor.state.doc.content.size;
  if (autofocus === false || autofocus === undefined) {
    // Consumer did not request focus. Put the selection at the very start and
    // blur so the document does not scroll past the editor on mount.
    editor.commands.setTextSelection(0);
    editor.commands.blur();
    return;
  }
  if (autofocus === "start") {
    editor.commands.focus("start");
    return;
  }
  if (autofocus === "end") {
    editor.commands.focus("end");
    return;
  }
  if (autofocus === "all") {
    editor.commands.setTextSelection({ from: 0, to: docSize });
    editor.commands.focus();
    return;
  }
  if (typeof autofocus === "number") {
    const clamped = Math.max(0, Math.min(autofocus, docSize));
    editor.commands.focus(clamped);
    return;
  }
  if (autofocus === true) {
    editor.commands.focus("start");
  }
}

/**
 * Options for creating a Vizel editor instance.
 * Extends VizelEditorOptions with additional framework-specific parameters.
 */
export interface CreateVizelEditorInstanceOptions extends VizelEditorOptions {
  /** Additional extensions to include */
  extensions?: Extensions;
  /** Factory function to create the slash menu renderer */
  createSlashMenuRenderer: () => Partial<SuggestionOptions<VizelSlashCommandItem>>;
}

/**
 * Result of creating a Vizel editor instance.
 */
export interface CreateVizelEditorInstanceResult {
  /** The created Tiptap editor instance */
  editor: Editor;
  /** Image upload options extracted from features (for event handler registration) */
  imageOptions: VizelImageFeatureOptions;
}

/**
 * Create a configured Vizel editor instance.
 *
 * Intended for internal framework integrations. End users should prefer the
 * framework primitives (`useVizelEditor` in `@vizel/react`/`@vizel/vue`,
 * `createVizelEditor` in `@vizel/svelte`) which call this helper for them.
 * The signature requires a `createSlashMenuRenderer` parameter that only
 * framework packages can provide, and the function may change between minor
 * releases.
 *
 * @example
 * ```typescript
 * // In a framework hook/composable/rune:
 * const { editor, imageOptions } = createVizelEditorInstance({
 *   initialMarkdown: "# Hello World",
 *   features: { table: true },
 *   createSlashMenuRenderer: () => createMySlashMenuRenderer(),
 *   onUpdate: ({ editor }) => console.log(editor.getJSON()),
 * });
 * ```
 */
export async function createVizelEditorInstance(
  options: CreateVizelEditorInstanceOptions
): Promise<CreateVizelEditorInstanceResult> {
  // Refuse to construct an editor on the server. Tiptap mounts to a
  // contenteditable element that only exists in the browser, so
  // calling this factory from a Node / edge runtime is a programming
  // error. Section 12 of the v2.0 design surfaces this as the
  // `SSR_NOT_SUPPORTED` typed error so consumers can distinguish it
  // from runtime failures.
  if (typeof document === "undefined") {
    throw createVizelError(
      "SSR_NOT_SUPPORTED",
      "createVizelEditorInstance cannot be called during SSR. Defer creation to a client lifecycle hook (useEffect, onMounted, onMount)."
    );
  }

  const {
    initialContent,
    initialMarkdown,
    transformDiagramsOnImport = true,
    placeholder,
    editable = true,
    autofocus = false,
    features,
    markdown,
    locale,
    extensions: additionalExtensions = [],
    createSlashMenuRenderer,
    onUpdate,
    onCreate,
    onDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
  } = options;
  const flavor = markdown?.flavor;
  const encoding = markdown?.encoding;

  if (initialContent !== undefined && initialMarkdown !== undefined) {
    // Programming error: the two options are mutually exclusive. Throwing
    // (instead of warning + silently picking one) ensures the misuse is
    // caught on the first run rather than masked behind a `console.warn`
    // a consumer might never see in production.
    throw createVizelError(
      "INVALID_CONFIG",
      "Cannot supply both `initialContent` and `initialMarkdown` to the editor. Pick one."
    );
  }

  validateVizelCollaborationFeatures(features);

  // Resolve features with slash menu renderer
  const resolvedFeatures = resolveVizelFeatures({
    ...(features !== undefined && { features }),
    createSlashMenuRenderer,
  });

  // Extract image options for event handler registration
  const imageOptions: VizelImageFeatureOptions =
    typeof features?.content?.image === "object" ? features.content.image : {};

  // Wrap onCreate to handle initialMarkdown. Tiptap's `setContent` resets the
  // selection to the end of the new document and triggers a scroll-into-view,
  // which silently overrides the constructor's `autofocus` option. Re-apply
  // the selection (and the autofocus default of "no scroll") after the markdown
  // has been loaded so the editor starts where the consumer asked.
  const wrappedOnCreate = initialMarkdown
    ? (props: { editor: Editor }) => {
        initializeVizelMarkdownContent(props.editor, initialMarkdown, {
          transformDiagrams: transformDiagramsOnImport,
        });
        applyInitialSelection(props.editor, autofocus);
        onCreate?.(props);
      }
    : onCreate;

  // Create extensions (async - optional dependencies are loaded dynamically)
  const vizelExtensions = await createVizelExtensions({
    ...(placeholder !== undefined && { placeholder }),
    ...(resolvedFeatures !== undefined && { features: resolvedFeatures }),
    ...(flavor !== undefined && { flavor }),
    ...(encoding !== undefined && { encoding }),
    ...(locale !== undefined && { locale }),
  });

  // Create the editor instance
  const editor = new Editor({
    extensions: [...vizelExtensions, ...additionalExtensions],
    // Only set initialContent if initialMarkdown is not provided
    ...(!initialMarkdown && initialContent !== undefined && { content: initialContent }),
    editable,
    autofocus,
    editorProps: vizelDefaultEditorProps,
    ...(onUpdate && { onUpdate }),
    ...(wrappedOnCreate && { onCreate: wrappedOnCreate }),
    ...(onDestroy && { onDestroy }),
    ...(onSelectionUpdate && { onSelectionUpdate }),
    ...(onFocus && { onFocus }),
    ...(onBlur && { onBlur }),
  });

  return {
    editor,
    imageOptions,
  };
}
