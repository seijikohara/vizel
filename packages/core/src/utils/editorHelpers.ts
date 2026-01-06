import type { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import type { CharacterCountStorage } from "../extensions/character-count.ts";
import { createImageUploader } from "../extensions/image.ts";
import type { VizelEditorState, VizelFeatureOptions, VizelImageFeatureOptions } from "../types.ts";

/**
 * JSON content type for Tiptap documents
 */
export interface ContentNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ContentNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

/**
 * Options for resolving features with a custom slash menu renderer.
 */
export interface ResolveFeaturesOptions {
  /** The features configuration */
  features?: VizelFeatureOptions;
  /** Factory function to create the slash menu renderer */
  createSlashMenuRenderer: () => unknown;
}

/**
 * Resolves feature options with default slash menu renderer.
 * If slashCommand is enabled but no suggestion renderer is provided,
 * automatically adds the provided renderer.
 */
export function resolveFeatures(options: ResolveFeaturesOptions): VizelFeatureOptions | undefined {
  const { features, createSlashMenuRenderer } = options;

  if (!features) {
    // No features specified, use defaults with auto slash menu
    return {
      slashCommand: {
        suggestion: createSlashMenuRenderer() as Record<string, unknown>,
      },
    };
  }

  if (features.slashCommand === false) {
    // Slash command explicitly disabled
    return features;
  }

  const slashOptions = typeof features.slashCommand === "object" ? features.slashCommand : {};

  // If suggestion is already provided, use it; otherwise add default
  if (slashOptions.suggestion) {
    return features;
  }

  return {
    ...features,
    slashCommand: {
      ...slashOptions,
      suggestion: createSlashMenuRenderer() as Record<string, unknown>,
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
export interface CreateUploadEventHandlerOptions {
  /** Function to get the current editor instance */
  getEditor: () => Editor | null | undefined;
  /** Function to get the current image options */
  getImageOptions: () => VizelImageFeatureOptions;
}

/**
 * Creates an event handler for the vizel:upload-image custom event.
 * This handler is used by the slash command to trigger image uploads.
 */
export function createUploadEventHandler(
  options: CreateUploadEventHandlerOptions
): (event: Event) => void {
  return (event: Event) => {
    const editor = options.getEditor();
    if (!editor) return;

    if (!isVizelUploadImageEvent(event)) return;
    const { file } = event.detail;
    const pos = editor.state.selection.from;
    const imageOptions = options.getImageOptions();

    // Create upload function with configured options
    const uploadFn = createImageUploader({
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
export function registerUploadEventHandler(options: CreateUploadEventHandlerOptions): () => void {
  const handler = createUploadEventHandler(options);
  document.addEventListener(VIZEL_UPLOAD_IMAGE_EVENT, handler);
  return () => {
    document.removeEventListener(VIZEL_UPLOAD_IMAGE_EVENT, handler);
  };
}

/**
 * Default editor props for Vizel editors.
 */
export const defaultEditorProps = {
  attributes: {
    class: "vizel-editor",
  },
};

/**
 * Type guard to check if character count storage is available.
 */
function hasCharacterCountStorage(
  storage: Record<string, unknown>
): storage is { characterCount: CharacterCountStorage } {
  return (
    "characterCount" in storage &&
    typeof storage.characterCount === "object" &&
    storage.characterCount !== null &&
    "characters" in storage.characterCount &&
    "words" in storage.characterCount
  );
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
 * const state = getEditorState(editor);
 * console.log(`Characters: ${state.characterCount}, Words: ${state.wordCount}`);
 * console.log(`Can undo: ${state.canUndo}, Can redo: ${state.canRedo}`);
 * ```
 */
export function getEditorState(editor: Editor | null | undefined): VizelEditorState {
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

  const storage = editor.storage as unknown as Record<string, unknown>;
  let characterCount = 0;
  let wordCount = 0;

  if (hasCharacterCountStorage(storage)) {
    characterCount = storage.characterCount.characters();
    wordCount = storage.characterCount.words();
  }

  return {
    isFocused: editor.isFocused,
    isEmpty: editor.isEmpty,
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    characterCount,
    wordCount,
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
 * const transformed = transformDiagramCodeBlocks(parsed);
 * editor.commands.setContent(transformed);
 * ```
 */
export function transformDiagramCodeBlocks(content: ContentNode): ContentNode {
  if (!content) return content;

  // Transform codeBlock with diagram language to diagram node
  const language = content.attrs?.language as string | undefined;
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
      content: content.content.map(transformDiagramCodeBlocks),
    };
  }

  return content;
}

/**
 * @deprecated Use `transformDiagramCodeBlocks` instead. This function only handles mermaid diagrams.
 */
export function transformMermaidToDiagram(content: ContentNode): ContentNode {
  return transformDiagramCodeBlocks(content);
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
 * convertCodeBlocksToDiagrams(editor);
 * ```
 */
export function convertCodeBlocksToDiagrams(editor: Editor): void {
  const diagramType = editor.schema.nodes.diagram;
  if (!diagramType) return;

  // Collect all diagram code blocks first (to avoid position shifting during replacement)
  const replacements: Array<{
    from: number;
    to: number;
    code: string;
    type: "mermaid" | "graphviz";
  }> = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "codeBlock") {
      const language = node.attrs.language as string | undefined;
      const diagramType = language ? DIAGRAM_LANGUAGES[language] : undefined;
      if (diagramType) {
        replacements.push({
          from: pos,
          to: pos + node.nodeSize,
          code: node.textContent.trim(),
          type: diagramType,
        });
      }
    }
  });

  if (replacements.length === 0) return;

  // Apply replacements in reverse order to preserve positions
  let { tr } = editor.state;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const replacement = replacements[i];
    if (!replacement) continue;
    const { from, to, code, type } = replacement;
    const diagramNode = diagramType.create({
      code,
      type,
    });
    tr = tr.replaceWith(from, to, diagramNode);
  }

  editor.view.dispatch(tr);
}

/**
 * @deprecated Use `convertCodeBlocksToDiagrams` instead. This function only handles mermaid diagrams.
 */
export function convertMermaidCodeBlocksToDiagrams(editor: Editor): void {
  convertCodeBlocksToDiagrams(editor);
}
