import type { Extensions } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import ListKeymap from "@tiptap/extension-list-keymap";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import Underline from "@tiptap/extension-underline";
import type { VizelFeatureOptions } from "../types.ts";
import { createCharacterCountExtension } from "./character-count.ts";
import { createCodeBlockLowlightExtension } from "./code-block-lowlight.ts";
import { createDragHandleExtensions } from "./drag-handle.ts";
import {
  createImageUploadExtension,
  defaultBase64Upload,
  defaultImageResizeOptions,
} from "./image.ts";
import { createLinkExtension } from "./link.ts";
import { createMarkdownExtension } from "./markdown.ts";
import { createMathematicsExtensions } from "./mathematics.ts";
import { defaultSlashCommands, SlashCommand, type SlashCommandItem } from "./slash-command.ts";
import { createTableExtensions } from "./table.ts";
import { createTaskListExtensions } from "./task-list.ts";
import { createTextColorExtensions } from "./text-color.ts";

export interface VizelExtensionsOptions {
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Configure heading levels (default: [1, 2, 3]) */
  headingLevels?: (1 | 2 | 3 | 4 | 5 | 6)[];
  /**
   * Feature configuration. All features are enabled by default.
   * Set to false to disable a feature, or pass options to configure it.
   */
  features?: VizelFeatureOptions;
}

/**
 * Create base extensions for text editing.
 * Includes: Document, Paragraph, Text, Heading, Blockquote, BulletList, OrderedList,
 * ListItem, HardBreak, HorizontalRule, Bold, Code, Italic, Strike,
 * Dropcursor, Gapcursor, History, ListKeymap
 *
 * Note: CodeBlock is NOT included here - it's added separately based on feature options
 * to support syntax highlighting when enabled.
 */
function createBaseExtensions(
  options: { headingLevels?: (1 | 2 | 3 | 4 | 5 | 6)[] } = {}
): Extensions {
  const { headingLevels = [1, 2, 3] } = options;

  return [
    // Nodes
    Document,
    Paragraph,
    Text,
    Heading.configure({ levels: headingLevels }),
    Blockquote,
    BulletList,
    OrderedList,
    ListItem,
    // CodeBlock is added separately based on feature options
    HardBreak,
    HorizontalRule,
    // Marks
    Bold,
    Code,
    Italic,
    Strike,
    Underline,
    // Functionality
    Dropcursor.configure({ color: "#3b82f6", width: 2 }),
    Gapcursor,
    History,
    ListKeymap,
  ];
}

/**
 * Add SlashCommand extension if enabled
 */
function addSlashCommandExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.slashCommand === false) return;

  const slashOptions = typeof features.slashCommand === "object" ? features.slashCommand : {};
  const items: SlashCommandItem[] = slashOptions.items ?? defaultSlashCommands;

  extensions.push(
    SlashCommand.configure({
      items,
      ...(slashOptions.suggestion !== undefined && {
        suggestion: slashOptions.suggestion as Record<string, unknown>,
      }),
    })
  );
}

/**
 * Add Image extension if enabled
 */
function addImageExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.image === false) return;

  const imageOptions = typeof features.image === "object" ? features.image : {};
  const onUpload = imageOptions.onUpload ?? defaultBase64Upload;
  const resizeEnabled = imageOptions.resize !== false;

  extensions.push(
    ...createImageUploadExtension({
      upload: {
        onUpload,
        ...(imageOptions.maxFileSize !== undefined && { maxFileSize: imageOptions.maxFileSize }),
        ...(imageOptions.allowedTypes !== undefined && { allowedTypes: imageOptions.allowedTypes }),
        ...(imageOptions.onValidationError !== undefined && {
          onValidationError: imageOptions.onValidationError,
        }),
        ...(imageOptions.onUploadError !== undefined && {
          onUploadError: imageOptions.onUploadError,
        }),
      },
      resize: resizeEnabled ? defaultImageResizeOptions : false,
    })
  );
}

/**
 * Add Markdown extension if enabled
 */
function addMarkdownExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.markdown !== true && typeof features.markdown !== "object") return;

  const markdownOptions = typeof features.markdown === "object" ? features.markdown : {};
  extensions.push(createMarkdownExtension(markdownOptions));
}

/**
 * Add Task List extension if enabled
 */
function addTaskListExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.taskList === false) return;

  const taskListOptions = typeof features.taskList === "object" ? features.taskList : {};
  extensions.push(...createTaskListExtensions(taskListOptions));
}

/**
 * Add Character Count extension if enabled
 */
function addCharacterCountExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.characterCount === false) return;

  const characterCountOptions =
    typeof features.characterCount === "object" ? features.characterCount : {};
  extensions.push(createCharacterCountExtension(characterCountOptions));
}

/**
 * Add Text Color and Highlight extensions if enabled
 */
function addTextColorExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.textColor === false) return;

  const textColorOptions = typeof features.textColor === "object" ? features.textColor : {};
  extensions.push(...createTextColorExtensions(textColorOptions));
}

/**
 * Add Code Block extension (with or without syntax highlighting)
 */
function addCodeBlockExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  // If codeBlock is explicitly set to false, don't add any code block extension
  if (features.codeBlock === false) {
    return;
  }

  // If codeBlock is enabled (true or options object), use syntax highlighting
  if (features.codeBlock === true || typeof features.codeBlock === "object") {
    const codeBlockOptions = typeof features.codeBlock === "object" ? features.codeBlock : {};
    extensions.push(...createCodeBlockLowlightExtension(codeBlockOptions));
  } else {
    // Default: use syntax highlighting with default options
    extensions.push(...createCodeBlockLowlightExtension());
  }
}

/**
 * Add Mathematics extension if enabled
 */
function addMathematicsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.mathematics === false) return;

  // Mathematics is disabled by default, must be explicitly enabled
  if (features.mathematics === true || typeof features.mathematics === "object") {
    const mathOptions = typeof features.mathematics === "object" ? features.mathematics : {};
    extensions.push(...createMathematicsExtensions(mathOptions));
  }
}

/**
 * Add Drag Handle extension if enabled
 */
function addDragHandleExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.dragHandle === false) return;

  const dragHandleOptions = typeof features.dragHandle === "object" ? features.dragHandle : {};
  extensions.push(...createDragHandleExtensions(dragHandleOptions));
}

/**
 * Create the default set of extensions for Vizel editor.
 * Most features (SlashCommand, Table, Link, Image) are enabled by default.
 * Markdown support is disabled by default and must be explicitly enabled.
 *
 * @example Basic usage (all default features enabled)
 * ```ts
 * const extensions = createVizelExtensions();
 * ```
 *
 * @example Disable specific features
 * ```ts
 * const extensions = createVizelExtensions({
 *   features: {
 *     table: false,
 *     slashCommand: false,
 *   },
 * });
 * ```
 *
 * @example Enable Markdown support
 * ```ts
 * const extensions = createVizelExtensions({
 *   features: {
 *     markdown: true,
 *   },
 * });
 *
 * // Then use:
 * editor.commands.setContent('# Hello', { contentType: 'markdown' });
 * const md = editor.getMarkdown();
 * ```
 *
 * @example Custom image upload
 * ```ts
 * const extensions = createVizelExtensions({
 *   features: {
 *     image: {
 *       onUpload: async (file) => {
 *         const formData = new FormData();
 *         formData.append('file', file);
 *         const res = await fetch('/api/upload', { method: 'POST', body: formData });
 *         return (await res.json()).url;
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function createVizelExtensions(options: VizelExtensionsOptions = {}): Extensions {
  const {
    placeholder = "Type '/' for commands...",
    headingLevels = [1, 2, 3],
    features = {},
  } = options;

  const extensions: Extensions = [
    ...createBaseExtensions({ headingLevels }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: "vizel-editor-empty",
      emptyNodeClass: "vizel-node-empty",
    }),
  ];

  // Add optional features
  addSlashCommandExtension(extensions, features);

  if (features.table !== false) {
    extensions.push(...createTableExtensions());
  }

  if (features.link !== false) {
    extensions.push(createLinkExtension());
  }

  addImageExtension(extensions, features);
  addMarkdownExtension(extensions, features);
  addTaskListExtension(extensions, features);
  addCharacterCountExtension(extensions, features);
  addTextColorExtension(extensions, features);
  addCodeBlockExtension(extensions, features);
  addMathematicsExtension(extensions, features);
  addDragHandleExtension(extensions, features);

  return extensions;
}

// Re-export individual extensions for advanced usage
export {
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  Document,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Heading,
  History,
  HorizontalRule,
  Italic,
  ListItem,
  ListKeymap,
  OrderedList,
  Paragraph,
  Placeholder,
  Strike,
  Text,
  Underline,
};
