import { Editor, type Extensions } from "@tiptap/core";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { createVizelExtensions } from "../extensions/base.ts";
import type { VizelSlashCommandItem } from "../extensions/slash-command.ts";
import type { VizelEditorOptions, VizelImageFeatureOptions } from "../types.ts";
import { resolveVizelFeatures, vizelDefaultEditorProps } from "./editorHelpers.ts";
import { initializeVizelMarkdownContent } from "./markdown.ts";

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
 * This is the recommended way for framework packages to create editors.
 * It handles all common setup including:
 * - Resolving feature options
 * - Creating extensions
 * - Setting up initial content (JSON or Markdown)
 * - Configuring editor props and callbacks
 *
 * @param options - Editor configuration options
 * @returns The created editor instance and extracted options
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
export function createVizelEditorInstance(
  options: CreateVizelEditorInstanceOptions
): CreateVizelEditorInstanceResult {
  const {
    initialContent,
    initialMarkdown,
    transformDiagramsOnImport = true,
    placeholder,
    editable = true,
    autofocus = false,
    features,
    extensions: additionalExtensions = [],
    createSlashMenuRenderer,
    onUpdate,
    onCreate,
    onDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
  } = options;

  // Resolve features with slash menu renderer
  const resolvedFeatures = resolveVizelFeatures({
    ...(features !== undefined && { features }),
    createSlashMenuRenderer,
  });

  // Extract image options for event handler registration
  const imageOptions: VizelImageFeatureOptions =
    typeof features?.image === "object" ? features.image : {};

  // Wrap onCreate to handle initialMarkdown
  const wrappedOnCreate = initialMarkdown
    ? (props: { editor: Editor }) => {
        initializeVizelMarkdownContent(props.editor, initialMarkdown, {
          transformDiagrams: transformDiagramsOnImport,
        });
        onCreate?.(props);
      }
    : onCreate;

  // Create the editor instance
  const editor = new Editor({
    extensions: [
      ...createVizelExtensions({
        ...(placeholder !== undefined && { placeholder }),
        ...(resolvedFeatures !== undefined && { features: resolvedFeatures }),
      }),
      ...additionalExtensions,
    ],
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
