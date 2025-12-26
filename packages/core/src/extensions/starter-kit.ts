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
import type { VizelFeatureOptions } from "../types.ts";
import { createImageUploadExtension, defaultImageResizeOptions } from "./image.ts";
import { createLinkExtension } from "./link.ts";
import { createMarkdownExtension } from "./markdown.ts";
import { defaultSlashCommands, SlashCommand, type SlashCommandItem } from "./slash-command.ts";
import { createTableExtensions } from "./table.ts";

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
 * Default base64 image uploader (converts file to data URL)
 */
function defaultBase64Upload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Create base extensions that were previously provided by StarterKit.
 * Includes: Document, Paragraph, Text, Heading, Blockquote, BulletList, OrderedList,
 * ListItem, CodeBlock, HardBreak, HorizontalRule, Bold, Code, Italic, Strike,
 * Dropcursor, Gapcursor, History, ListKeymap
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
    Heading.configure({
      levels: headingLevels,
    }),
    Blockquote,
    BulletList,
    OrderedList,
    ListItem,
    CodeBlock,
    HardBreak,
    HorizontalRule,
    // Marks
    Bold,
    Code,
    Italic,
    Strike,
    // Functionality
    Dropcursor.configure({
      color: "#3b82f6",
      width: 2,
    }),
    Gapcursor,
    History,
    ListKeymap,
  ];
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

  // Slash Command (enabled by default)
  if (features.slashCommand !== false) {
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

  // Table (enabled by default)
  if (features.table !== false) {
    extensions.push(...createTableExtensions());
  }

  // Link (enabled by default)
  if (features.link !== false) {
    extensions.push(createLinkExtension());
  }

  // Image (enabled by default with base64 upload)
  if (features.image !== false) {
    const imageOptions = typeof features.image === "object" ? features.image : {};
    const onUpload = imageOptions.onUpload ?? defaultBase64Upload;
    const resizeEnabled = imageOptions.resize !== false;

    extensions.push(
      ...createImageUploadExtension({
        upload: {
          onUpload,
          ...(imageOptions.maxFileSize !== undefined && { maxFileSize: imageOptions.maxFileSize }),
          ...(imageOptions.allowedTypes !== undefined && {
            allowedTypes: imageOptions.allowedTypes,
          }),
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

  // Markdown (disabled by default)
  if (features.markdown === true || typeof features.markdown === "object") {
    const markdownOptions = typeof features.markdown === "object" ? features.markdown : {};
    extensions.push(createMarkdownExtension(markdownOptions));
  }

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
};
