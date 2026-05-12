import { Editor, type Extensions } from "@tiptap/core";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { createVizelExtensions } from "../extensions/base.ts";
import type { VizelSlashCommandItem } from "../extensions/slash-command.ts";
import type { VizelEditorOptions, VizelImageFeatureOptions } from "../types.ts";
import { resolveVizelFeatures, vizelDefaultEditorProps } from "./editorHelpers.ts";
import { initializeVizelMarkdownContent } from "./markdown.ts";

/**
 * Re-apply the selection requested by the constructor's `autofocus` option
 * after `setContent` has overridden it. Tiptap's `setContent` always lands
 * the selection at the end of the new document and triggers `scrollIntoView`,
 * which we have to undo for cases where the consumer asked for "start", "all",
 * a numeric position, or no focus at all.
 */
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
  const {
    initialContent,
    initialMarkdown,
    transformDiagramsOnImport = true,
    placeholder,
    editable = true,
    autofocus = false,
    features,
    flavor,
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

  if (initialContent !== undefined && initialMarkdown !== undefined) {
    console.warn(
      "[Vizel] Both initialContent and initialMarkdown were provided. " +
        "initialMarkdown takes precedence; initialContent will be ignored."
    );
  }

  // Resolve features with slash menu renderer
  const resolvedFeatures = resolveVizelFeatures({
    ...(features !== undefined && { features }),
    createSlashMenuRenderer,
  });

  // Extract image options for event handler registration
  const imageOptions: VizelImageFeatureOptions =
    typeof features?.image === "object" ? features.image : {};

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
