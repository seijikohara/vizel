import type { Extensions } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
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
import { createVizelCharacterCountExtension } from "./character-count.ts";
import type { VizelCodeBlockOptions } from "./code-block-lowlight.ts";
import { createVizelDetailsExtensions } from "./details.ts";
import { createVizelDiagramExtension } from "./diagram.ts";
import { createVizelDragHandleExtensions } from "./drag-handle.ts";
import { createVizelEmbedExtension } from "./embed.ts";
import {
  createVizelImageUploadExtensions,
  defaultImageResizeOptions,
  vizelDefaultBase64Upload,
} from "./image.ts";
import { createVizelLinkExtension } from "./link.ts";
import { createVizelMarkdownExtension } from "./markdown.ts";
import { createVizelMathematicsExtensions } from "./mathematics.ts";
import {
  VizelSlashCommand,
  type VizelSlashCommandItem,
  vizelDefaultSlashCommands,
} from "./slash-command.ts";
import { createVizelTableExtensions } from "./table.ts";
import { createVizelTaskListExtensions } from "./task-list.ts";
import { createVizelTextColorExtensions } from "./text-color.ts";
import { createVizelWikiLinkExtension } from "./wiki-link.ts";

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
  const items: VizelSlashCommandItem[] = slashOptions.items ?? vizelDefaultSlashCommands;

  extensions.push(
    VizelSlashCommand.configure({
      items,
      ...(slashOptions.suggestion !== undefined && {
        suggestion: slashOptions.suggestion,
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
  const onUpload = imageOptions.onUpload ?? vizelDefaultBase64Upload;
  const resizeEnabled = imageOptions.resize !== false;

  extensions.push(
    ...createVizelImageUploadExtensions({
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
 * Add Markdown extension if enabled (enabled by default)
 */
function addMarkdownExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.markdown === false) return;

  const markdownOptions = typeof features.markdown === "object" ? features.markdown : {};
  extensions.push(createVizelMarkdownExtension(markdownOptions));
}

/**
 * Add Task List extension if enabled
 */
function addTaskListExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.taskList === false) return;

  const taskListOptions = typeof features.taskList === "object" ? features.taskList : {};
  extensions.push(...createVizelTaskListExtensions(taskListOptions));
}

/**
 * Add Character Count extension if enabled
 */
function addCharacterCountExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.characterCount === false) return;

  const characterCountOptions =
    typeof features.characterCount === "object" ? features.characterCount : {};
  extensions.push(createVizelCharacterCountExtension(characterCountOptions));
}

/**
 * Add Text Color and Highlight extensions if enabled
 */
function addTextColorExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.textColor === false) return;

  const textColorOptions = typeof features.textColor === "object" ? features.textColor : {};
  extensions.push(...createVizelTextColorExtensions(textColorOptions));
}

/**
 * Add Code Block extension (with or without syntax highlighting).
 * Async because lowlight is loaded dynamically as an optional dependency.
 */
async function addCodeBlockExtension(
  extensions: Extensions,
  features: VizelFeatureOptions
): Promise<void> {
  // If codeBlock is explicitly set to false, don't add any code block extension
  if (features.codeBlock === false) {
    return;
  }

  // Dynamically import to avoid loading lowlight at module evaluation time
  const { createVizelCodeBlockExtension } = await import("./code-block-lowlight.ts");

  // If codeBlock is enabled (true or options object), use syntax highlighting
  if (features.codeBlock === true || typeof features.codeBlock === "object") {
    const codeBlockOptions: VizelCodeBlockOptions =
      typeof features.codeBlock === "object" ? features.codeBlock : {};
    extensions.push(...(await createVizelCodeBlockExtension(codeBlockOptions)));
  } else {
    // Default: use syntax highlighting with default options
    extensions.push(...(await createVizelCodeBlockExtension()));
  }
}

/**
 * Add Mathematics extension if enabled (enabled by default)
 */
function addMathematicsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.mathematics === false) return;

  const mathOptions = typeof features.mathematics === "object" ? features.mathematics : {};
  extensions.push(...createVizelMathematicsExtensions(mathOptions));
}

/**
 * Add Drag Handle extension if enabled
 */
function addDragHandleExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.dragHandle === false) return;

  const dragHandleOptions = typeof features.dragHandle === "object" ? features.dragHandle : {};
  extensions.push(...createVizelDragHandleExtensions(dragHandleOptions));
}

/**
 * Add Details extension if enabled (enabled by default)
 */
function addDetailsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.details === false) return;

  const detailsOptions = typeof features.details === "object" ? features.details : {};
  extensions.push(...createVizelDetailsExtensions(detailsOptions));
}

/**
 * Add Embed extension if enabled (enabled by default)
 */
function addEmbedExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.embed === false) return;

  const embedOptions = typeof features.embed === "object" ? features.embed : {};
  extensions.push(createVizelEmbedExtension(embedOptions));
}

/**
 * Add Diagram extension if enabled (enabled by default)
 */
function addDiagramExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (features.diagram === false) return;

  const diagramOptions = typeof features.diagram === "object" ? features.diagram : {};
  extensions.push(createVizelDiagramExtension(diagramOptions));
}

/**
 * Add Wiki Link extension if enabled (disabled by default)
 */
function addWikiLinkExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  if (!features.wikiLink) return;

  const wikiLinkOptions = typeof features.wikiLink === "object" ? features.wikiLink : {};
  extensions.push(createVizelWikiLinkExtension(wikiLinkOptions));
}

/**
 * Create the default set of extensions for Vizel editor.
 * All features are enabled by default. Set any feature to `false` to disable it.
 *
 * @example Basic usage (all features enabled)
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
 *     mathematics: false,
 *   },
 * });
 * ```
 *
 * @example Using Markdown support (enabled by default)
 * ```ts
 * const extensions = createVizelExtensions();
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
export async function createVizelExtensions(
  options: VizelExtensionsOptions = {}
): Promise<Extensions> {
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

  // Add optional features (sync)
  addSlashCommandExtension(extensions, features);

  if (features.table !== false) {
    const tableOptions = typeof features.table === "object" ? features.table : {};
    extensions.push(...createVizelTableExtensions(tableOptions));
  }

  if (features.link !== false) {
    const linkOptions = typeof features.link === "object" ? features.link : {};
    extensions.push(createVizelLinkExtension(linkOptions));
  }

  addImageExtension(extensions, features);
  addMarkdownExtension(extensions, features);
  addTaskListExtension(extensions, features);
  addCharacterCountExtension(extensions, features);
  addTextColorExtension(extensions, features);
  addMathematicsExtension(extensions, features);
  addDragHandleExtension(extensions, features);
  addDetailsExtension(extensions, features);
  addEmbedExtension(extensions, features);
  addDiagramExtension(extensions, features);
  addWikiLinkExtension(extensions, features);

  // Add code block extension (async - lowlight is loaded dynamically)
  await addCodeBlockExtension(extensions, features);

  return extensions;
}
