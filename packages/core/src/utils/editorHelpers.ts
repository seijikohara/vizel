import type { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import type { SuggestionOptions } from "@tiptap/suggestion";

import type { VizelCommand } from "../commands/types.ts";
import type { VizelCharacterCountStorage } from "../extensions/character-count.ts";
import { createVizelImageUploader } from "../extensions/image.ts";
import type { VizelEditorState, VizelFeatureOptions, VizelImageFeatureOptions } from "../types.ts";
import type { VizelError } from "./errorHandling.ts";

/**
 * Mount a Tiptap editor's `view.dom` into a container element and return a
 * disposer that removes it.
 *
 * Each framework's `VizelEditor` component previously hand-wrote the same
 * three-step pattern:
 *
 * 1. `container.appendChild(editor.view.dom)`
 * 2. `editor.view.setProps({ editable: () => editor.isEditable })`
 * 3. Cleanup that removes the DOM only if it is still parented to `container`
 *    (so swapping the editor or container does not yank a node that has
 *    already been re-parented elsewhere).
 *
 * Lifting this into core keeps the three adapters as thin lifecycle wrappers
 * and ensures behavior parity across React, Vue, and Svelte.
 *
 * @returns A disposer that detaches the editor view from the container.
 */
export function mountVizelEditorView(editor: Editor, container: HTMLElement): () => void {
  container.appendChild(editor.view.dom);
  editor.view.setProps({
    editable: () => editor.isEditable,
  });
  return () => {
    // The framework may destroy the editor before this disposer runs (an
    // unmount that disposes the editor ahead of detaching its view); reading
    // `editor.view` on a destroyed editor then throws. Skip detaching a view
    // that no longer exists.
    if (editor.isDestroyed) return;
    if (editor.view.dom.parentNode === container) {
      container.removeChild(editor.view.dom);
    }
  };
}

/**
 * JSON content type for Tiptap documents
 */
export interface VizelContentNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: VizelContentNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

/**
 * Options for resolving features with a custom slash menu renderer.
 */
export interface VizelResolveFeaturesOptions {
  /** The features configuration */
  features?: VizelFeatureOptions;
  /** Factory function to create the slash menu renderer */
  createSlashMenuRenderer: () => Partial<SuggestionOptions<VizelCommand>>;
}

/**
 * Resolves feature options with a default slash menu renderer.
 * If `interaction.slashMenu` is enabled but no suggestion renderer is
 * provided, attaches the supplied default.
 */
export function resolveVizelFeatures(
  options: VizelResolveFeaturesOptions
): VizelFeatureOptions | undefined {
  const { features, createSlashMenuRenderer } = options;

  if (!features) {
    return {
      interaction: {
        slashMenu: { suggestion: createSlashMenuRenderer() },
      },
    };
  }

  const interaction = features.interaction;
  if (interaction?.slashMenu === false) {
    return features;
  }

  const slashOptions = typeof interaction?.slashMenu === "object" ? interaction.slashMenu : {};

  if (slashOptions.suggestion) {
    return features;
  }

  return {
    ...features,
    interaction: {
      ...interaction,
      slashMenu: {
        ...slashOptions,
        suggestion: createSlashMenuRenderer(),
      },
    },
  };
}

/** Type guard for vizel upload image custom event */
const isVizelUploadImageEvent = (
  event: Event
): event is CustomEvent<{ file: File; editor: Editor }> =>
  event instanceof CustomEvent &&
  typeof event.detail === "object" &&
  event.detail !== null &&
  "file" in event.detail &&
  "editor" in event.detail;

/**
 * Options for creating an image upload event handler.
 */
export interface VizelCreateUploadEventHandlerOptions {
  /** Function to get the current editor instance */
  getEditor: () => Editor | null | undefined;
  /** Function to get the current image options */
  getImageOptions: () => VizelImageFeatureOptions;
  /**
   * Function to get the editor-level `onError` sink.
   *
   * Threading this getter lets the slash-command upload path reach the
   * editor's `onError` so an upload rejection emits a `VizelError`
   * (`UPLOAD_FAILED`) to observability sinks, not only the feature-level
   * `onUploadError`. Adapters read the latest `onError` lazily because the
   * consumer may reassign it after mount.
   */
  getOnError?: () => ((err: VizelError) => void) | undefined;
}

/**
 * Creates an event handler for the vizel:upload-image custom event.
 * This handler is used by the slash command to trigger image uploads.
 */
export function createVizelUploadEventHandler(
  options: VizelCreateUploadEventHandlerOptions
): (event: Event) => void {
  return (event: Event) => {
    const editor = options.getEditor();
    if (!editor) return;

    if (!isVizelUploadImageEvent(event)) return;
    const { file } = event.detail;
    const pos = editor.state.selection.from;
    const imageOptions = options.getImageOptions();

    // Resolve the editor-level error sink. Prefer the thread-through
    // `getOnError` (the editor's `onError`); fall back to a per-feature
    // `onError` a consumer may have set directly on the image options.
    const onError = options.getOnError?.() ?? imageOptions.onError;

    // Create upload function with configured options
    const uploadFn = createVizelImageUploader({
      onUpload:
        imageOptions.onUpload ??
        ((f: File) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              }
            };
            reader.readAsDataURL(f);
          })),
      ...(imageOptions.maxFileSize !== undefined && { maxFileSize: imageOptions.maxFileSize }),
      ...(imageOptions.allowedTypes !== undefined && { allowedTypes: imageOptions.allowedTypes }),
      ...(imageOptions.onValidationError !== undefined && {
        onValidationError: imageOptions.onValidationError,
      }),
      ...(imageOptions.onUploadError !== undefined && {
        onUploadError: imageOptions.onUploadError,
      }),
      ...(onError !== undefined && { onError }),
    });

    uploadFn(file, editor.view as EditorView, pos);
  };
}

/**
 * The custom event name for image uploads from slash commands.
 */
export const VIZEL_UPLOAD_IMAGE_EVENT = "vizel:upload-image";

/**
 * Registers the image upload event handler.
 * Returns a cleanup function to remove the event listener.
 */
export function registerVizelUploadEventHandler(
  options: VizelCreateUploadEventHandlerOptions
): () => void {
  const handler = createVizelUploadEventHandler(options);
  document.addEventListener(VIZEL_UPLOAD_IMAGE_EVENT, handler);
  return () => {
    document.removeEventListener(VIZEL_UPLOAD_IMAGE_EVENT, handler);
  };
}

/**
 * Default editor props for Vizel editors.
 */
export const vizelDefaultEditorProps = {
  attributes: {
    class: "vizel-editor",
  },
};

/**
 * Type guard to check if character count storage is available.
 */
function hasVizelCharacterCountStorage(
  storage: unknown
): storage is { characterCount: VizelCharacterCountStorage } {
  if (typeof storage !== "object" || storage === null) return false;
  if (!("characterCount" in storage)) return false;

  const record = storage as Record<string, unknown>;
  const cc = record.characterCount;
  if (typeof cc !== "object" || cc === null) return false;

  const ccRecord = cc as Record<string, unknown>;
  return typeof ccRecord.characters === "function" && typeof ccRecord.words === "function";
}

/**
 * Extracts the current editor state from an editor instance.
 * This provides a snapshot of common editor state values including
 * focus, empty status, undo/redo availability, and character/word counts.
 *
 * @param editor - The editor instance to extract state from
 * @returns The current editor state
 *
 * @example
 * ```typescript
 * const state = getVizelEditorState(editor);
 * console.log(`Characters: ${state.characterCount}, Words: ${state.wordCount}`);
 * console.log(`Can undo: ${state.canUndo}, Can redo: ${state.canRedo}`);
 * ```
 */
export function getVizelEditorState(editor: Editor | null | undefined): VizelEditorState {
  if (!editor) {
    return {
      isFocused: false,
      isEmpty: true,
      canUndo: false,
      canRedo: false,
      characterCount: 0,
      wordCount: 0,
    };
  }

  const storage: unknown = editor.storage;
  const counts = hasVizelCharacterCountStorage(storage)
    ? {
        characterCount: storage.characterCount.characters(),
        wordCount: storage.characterCount.words(),
      }
    : { characterCount: 0, wordCount: 0 };

  return {
    isFocused: editor.isFocused,
    isEmpty: editor.isEmpty,
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    ...counts,
  };
}

/**
 * Diagram languages that should be converted to diagram nodes.
 */
const DIAGRAM_LANGUAGES: Record<string, "mermaid" | "graphviz"> = {
  mermaid: "mermaid",
  dot: "graphviz",
  graphviz: "graphviz",
};

/**
 * Transform content to convert diagram code blocks to diagram nodes.
 * This is useful when importing markdown content that contains diagrams.
 * Supports mermaid, dot, and graphviz code blocks.
 *
 * @param content - The content to transform (JSONContent format)
 * @returns The transformed content with diagram code blocks converted to diagram nodes
 *
 * @example
 * ```typescript
 * // After parsing markdown with editor.markdown.parse()
 * const parsed = editor.markdown.parse(markdownText);
 * const transformed = transformVizelDiagramCodeBlocks(parsed);
 * editor.commands.setContent(transformed);
 * ```
 */
export function transformVizelDiagramCodeBlocks(content: VizelContentNode): VizelContentNode {
  if (!content) return content;

  // Transform codeBlock with diagram language to diagram node
  const languageAttr = content.attrs?.language;
  const language = typeof languageAttr === "string" ? languageAttr : undefined;
  if (content.type === "codeBlock" && language && language in DIAGRAM_LANGUAGES) {
    // Extract text content from the code block
    const code =
      content.content
        ?.map((node) => node.text || "")
        .join("")
        .trim() || "";

    return {
      type: "diagram",
      attrs: {
        code,
        type: DIAGRAM_LANGUAGES[language],
      },
    };
  }

  // Recursively transform content array
  if (content.content && Array.isArray(content.content)) {
    return {
      ...content,
      content: content.content.map(transformVizelDiagramCodeBlocks),
    };
  }

  return content;
}

/**
 * Convert all diagram code blocks in a document to diagram nodes.
 * This command should be called after importing markdown content.
 * Supports mermaid, dot, and graphviz code blocks.
 *
 * @param editor - The editor instance
 *
 * @example
 * ```typescript
 * editor.commands.setContent(markdownText, { contentType: 'markdown' });
 * convertVizelCodeBlocksToDiagrams(editor);
 * ```
 */
export function convertVizelCodeBlocksToDiagrams(editor: Editor): void {
  const diagramType = editor.schema.nodes.diagram;
  if (!diagramType) return;

  // Collect all diagram code blocks first (to avoid position shifting during replacement)
  const replacements: {
    from: number;
    to: number;
    code: string;
    type: "mermaid" | "graphviz";
  }[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "codeBlock") {
      const languageAttr = node.attrs.language;
      const language = typeof languageAttr === "string" ? languageAttr : undefined;
      const resolvedDiagramType = language ? DIAGRAM_LANGUAGES[language] : undefined;
      if (resolvedDiagramType) {
        replacements.push({
          from: pos,
          to: pos + node.nodeSize,
          code: node.textContent.trim(),
          type: resolvedDiagramType,
        });
      }
    }
  });

  if (replacements.length === 0) return;

  // Apply replacements in reverse order to preserve positions
  const tr = replacements.toReversed().reduce((acc, { from, to, code, type }) => {
    const diagramNode = diagramType.create({ code, type });
    return acc.replaceWith(from, to, diagramNode);
  }, editor.state.tr);

  editor.view.dispatch(tr);
}
