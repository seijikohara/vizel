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
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Text from "@tiptap/extension-text";
import Underline from "@tiptap/extension-underline";
import type { VizelLocale } from "../i18n/types.ts";
import type {
  VizelMarkdownEncodingOptions,
  VizelMarkdownFlavor,
  VizelMarkdownLossyEncodingMode,
} from "../markdown/types.ts";
import type { VizelFeatureOptions } from "../types.ts";
import type { VizelError } from "../utils/errorHandling.ts";
import { resolveVizelFlavorConfig, type VizelFlavorConfig } from "../utils/markdown-flavors.ts";
import { createVizelBlockClipboardExtension } from "./block-clipboard.ts";
import { createVizelCalloutExtension } from "./callout.ts";
import { createVizelCharacterCountExtension } from "./character-count.ts";
import { createVizelCommentExtension } from "./comment.ts";
import { createVizelDetailsExtensions } from "./details.ts";
import { createVizelDiagramExtension } from "./diagram.ts";
import { createVizelDragHandleExtensions } from "./drag-handle.ts";
import { createVizelEmbedExtension } from "./embed.ts";
import { createVizelHighlightExtension } from "./highlight.ts";
import {
  createVizelImageUploadExtensions,
  defaultImageResizeOptions,
  vizelDefaultBase64Upload,
} from "./image.ts";
import { createVizelLinkExtension } from "./link.ts";
import { createVizelMarkdownExtension } from "./markdown.ts";
import { createVizelMathematicsExtensions } from "./mathematics.ts";
import { createVizelMentionExtension } from "./mention.ts";
import { createVizelMultiBlockSelectionExtension } from "./multi-block-selection.ts";
import { createVizelPresenceExtension } from "./presence.ts";
import {
  VizelSlashCommand,
  type VizelSlashCommandItem,
  vizelDefaultSlashCommands,
} from "./slash-command.ts";
import { createVizelTableExtensions } from "./table.ts";
import { createVizelTableOfContentsExtension } from "./table-of-contents.ts";
import { createVizelTaskListExtensions } from "./task-list.ts";
import { createVizelTextColorExtensions } from "./text-color.ts";
import { createVizelTypographyExtension } from "./typography.ts";
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
  /**
   * Markdown output flavor.
   * Controls how extensions serialize their content to Markdown.
   * @default "gfm"
   */
  flavor?: VizelMarkdownFlavor;
  /**
   * Per-node encoding mode for nodes that have no canonical Markdown
   * representation (`embed`, `mention`, `wikiLink`). See
   * {@link VizelMarkdownEncodingOptions}.
   */
  encoding?: VizelMarkdownEncodingOptions;
  /**
   * Locale for editor UI strings.
   * If not provided, default English strings are used.
   */
  locale?: VizelLocale;
  /**
   * Editor-level error sink threaded into the drop / paste image-upload
   * plugin so an upload rejection emits a `VizelError` (`UPLOAD_FAILED`)
   * to observability sinks, not only the feature-level `onUploadError`.
   */
  onError?: (err: VizelError) => void;
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
  options: {
    headingLevels?: (1 | 2 | 3 | 4 | 5 | 6)[];
    excludeHistory?: boolean;
    historyDepth?: number;
  } = {}
): Extensions {
  const { headingLevels = [1, 2, 3, 4, 5, 6], excludeHistory = false, historyDepth } = options;

  const extensions: Extensions = [
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
    // Functionality
    Dropcursor.configure({ color: "#3b82f6", width: 2 }),
    Gapcursor,
    ListKeymap,
    // Multi-block range selection — always-on
    createVizelMultiBlockSelectionExtension(),
    // Block-aware clipboard — always-on
    createVizelBlockClipboardExtension(),
  ];

  // History is excluded when collaboration is enabled (Yjs provides its own undo manager)
  if (!excludeHistory) {
    extensions.push(
      historyDepth === undefined ? History : History.configure({ depth: historyDepth })
    );
  }

  return extensions;
}

/**
 * Add SlashMenu extension if enabled (enabled by default).
 */
function addSlashMenuExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const slashMenu = features.interaction?.slashMenu;
  if (slashMenu === false) return;

  const slashOptions = typeof slashMenu === "object" ? slashMenu : {};
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
 * Add Image extension if enabled (enabled by default).
 */
function addImageExtension(
  extensions: Extensions,
  features: VizelFeatureOptions,
  onError?: (err: VizelError) => void
): void {
  const image = features.content?.image;
  if (image === false) return;

  const imageOptions = typeof image === "object" ? image : {};
  const onUpload = imageOptions.onUpload ?? vizelDefaultBase64Upload;
  const resizeEnabled = imageOptions.resize !== false;
  // Prefer the editor-level `onError`; fall back to a per-feature `onError`
  // a consumer may set directly on the image options.
  const resolvedOnError = onError ?? imageOptions.onError;

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
        ...(resolvedOnError !== undefined && { onError: resolvedOnError }),
      },
      resize: resizeEnabled ? defaultImageResizeOptions : false,
    })
  );
}

/**
 * Add Task List extension if enabled (enabled by default).
 */
function addTaskListExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const taskList = features.content?.taskList;
  if (taskList === false) return;

  const taskListOptions = typeof taskList === "object" ? taskList : {};
  extensions.push(...createVizelTaskListExtensions(taskListOptions));
}

/**
 * Add Character Count extension if enabled (enabled by default).
 */
function addCharacterCountExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const characterCount = features.interaction?.characterCount;
  if (characterCount === false) return;

  const characterCountOptions = typeof characterCount === "object" ? characterCount : {};
  extensions.push(createVizelCharacterCountExtension(characterCountOptions));
}

/**
 * Add Text Color and Highlight extensions if enabled (enabled by default).
 */
function addTextColorExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const textColor = features.content?.textColor;
  if (textColor === false) return;

  const textColorOptions = typeof textColor === "object" ? textColor : {};
  extensions.push(...createVizelTextColorExtensions(textColorOptions));
}

/**
 * Add Highlight extension if enabled (enabled by default).
 */
function addHighlightExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const highlight = features.content?.highlight;
  if (highlight === false) return;

  const highlightOptions = typeof highlight === "object" ? highlight : {};
  extensions.push(...createVizelHighlightExtension(highlightOptions));
}

/**
 * Add Code Block extension (always-on).
 * Async because lowlight is loaded dynamically as an optional dependency.
 */
async function addCodeBlockExtension(extensions: Extensions, locale?: VizelLocale): Promise<void> {
  const { createVizelCodeBlockExtension } = await import("./code-block-lowlight.ts");
  extensions.push(
    ...(await createVizelCodeBlockExtension({
      ...(locale !== undefined && { locale }),
    }))
  );
}

/**
 * Add Mathematics extension if enabled (enabled by default).
 */
function addMathematicsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const mathematics = features.content?.mathematics;
  if (mathematics === false) return;

  const mathOptions = typeof mathematics === "object" ? mathematics : {};
  extensions.push(...createVizelMathematicsExtensions(mathOptions));
}

/**
 * Add Drag Handle extension if enabled (enabled by default).
 */
function addDragHandleExtension(
  extensions: Extensions,
  features: VizelFeatureOptions,
  locale?: VizelLocale
): void {
  const dragHandle = features.interaction?.dragHandle;
  if (dragHandle === false) return;

  const dragHandleOptions = typeof dragHandle === "object" ? dragHandle : {};
  extensions.push(
    ...createVizelDragHandleExtensions({
      ...dragHandleOptions,
      ...(locale !== undefined && { locale }),
    })
  );
}

/**
 * Add Details extension if enabled (enabled by default).
 */
function addDetailsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const details = features.content?.details;
  if (details === false) return;

  const detailsOptions = typeof details === "object" ? details : {};
  extensions.push(...createVizelDetailsExtensions(detailsOptions));
}

/**
 * Add Embed extension if enabled (enabled by default).
 */
function addEmbedExtension(
  extensions: Extensions,
  features: VizelFeatureOptions,
  embedEncoding: VizelMarkdownLossyEncodingMode | undefined
): void {
  const embed = features.content?.embed;
  if (embed === false) return;

  const embedOptions = typeof embed === "object" ? embed : {};
  extensions.push(
    createVizelEmbedExtension({
      ...embedOptions,
      ...(embedEncoding !== undefined && { encoding: embedEncoding }),
    })
  );
}

/**
 * Add Diagram extension if enabled (enabled by default).
 */
function addDiagramExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const diagram = features.content?.diagram;
  if (diagram === false) return;

  const diagramOptions = typeof diagram === "object" ? diagram : {};
  extensions.push(createVizelDiagramExtension(diagramOptions));
}

/**
 * Add Table of Contents extension if enabled (enabled by default).
 */
function addTableOfContentsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const tableOfContents = features.content?.tableOfContents;
  if (tableOfContents === false) return;

  const tocOptions = typeof tableOfContents === "object" ? tableOfContents : {};
  extensions.push(createVizelTableOfContentsExtension(tocOptions));
}

/**
 * Add Wiki Link extension if enabled (disabled by default).
 * Injects the flavor-specific serialization setting.
 */
function addWikiLinkExtension(
  extensions: Extensions,
  features: VizelFeatureOptions,
  flavorConfig: VizelFlavorConfig,
  wikiLinkEncoding: VizelMarkdownLossyEncodingMode | undefined
): void {
  const wikiLink = features.content?.wikiLink;
  if (!wikiLink) return;

  const wikiLinkOptions = typeof wikiLink === "object" ? wikiLink : {};
  extensions.push(
    createVizelWikiLinkExtension({
      ...wikiLinkOptions,
      serializeAsWikiLink: wikiLinkOptions.serializeAsWikiLink ?? flavorConfig.wikiLinkSerialize,
      ...(wikiLinkEncoding !== undefined && { encoding: wikiLinkEncoding }),
    })
  );
}

/**
 * Add Callout extension if enabled (enabled by default).
 * Injects the flavor-specific markdown format.
 */
function addCalloutExtension(
  extensions: Extensions,
  features: VizelFeatureOptions,
  flavorConfig: VizelFlavorConfig
): void {
  const callout = features.content?.callout;
  if (callout === false) return;

  const calloutOptions = typeof callout === "object" ? callout : {};
  extensions.push(
    createVizelCalloutExtension({
      ...calloutOptions,
      markdownFormat: calloutOptions.markdownFormat ?? flavorConfig.calloutFormat,
    })
  );
}

/**
 * Add Mention extension if enabled (disabled by default).
 */
function addMentionExtension(
  extensions: Extensions,
  features: VizelFeatureOptions,
  mentionEncoding: VizelMarkdownLossyEncodingMode | undefined
): void {
  const mention = features.interaction?.mention;
  if (!mention) return;

  const mentionOptions = typeof mention === "object" ? mention : {};
  extensions.push(
    createVizelMentionExtension({
      ...mentionOptions,
      ...(mentionEncoding !== undefined && { encoding: mentionEncoding }),
    })
  );
}

/**
 * Add Comments extension if enabled (disabled by default).
 */
function addCommentsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const comments = features.collaboration?.comments;
  if (!comments) return;

  const commentOptions = typeof comments === "object" ? comments : {};
  extensions.push(createVizelCommentExtension(commentOptions));
}

/**
 * Add Presence extension if configured (disabled by default).
 *
 * Renders other collaborators' cursors and selections via the supplied
 * awareness adapter.
 */
function addPresenceExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const presence = features.collaboration?.presence;
  if (!presence) return;
  extensions.push(createVizelPresenceExtension(presence));
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
 *     content: {
 *       table: false,
 *       mathematics: false,
 *     },
 *     interaction: {
 *       slashMenu: false,
 *     },
 *   },
 * });
 * ```
 *
 * @example Using Markdown support (always-on)
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
 *     content: {
 *       image: {
 *         onUpload: async (file) => {
 *           const formData = new FormData();
 *           formData.append('file', file);
 *           const res = await fetch('/api/upload', { method: 'POST', body: formData });
 *           return (await res.json()).url;
 *         },
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
    headingLevels = [1, 2, 3, 4, 5, 6],
    features = {},
    flavor,
    encoding,
    locale,
    onError,
  } = options;

  const flavorConfig = resolveVizelFlavorConfig(flavor);
  const excludeHistory = Boolean(features.collaboration?.provider);
  const historyDepth = features.interaction?.historyDepth;
  const placeholderText = features.interaction?.placeholder ?? placeholder;

  const extensions: Extensions = [
    ...createBaseExtensions({
      headingLevels,
      excludeHistory,
      ...(historyDepth !== undefined && { historyDepth }),
    }),
    Placeholder.configure({
      placeholder: placeholderText,
      emptyEditorClass: "vizel-editor-empty",
      emptyNodeClass: "vizel-node-empty",
    }),
  ];

  // Always-on (no feature flag)
  extensions.push(createVizelLinkExtension({}));
  extensions.push(createVizelMarkdownExtension({ ...(flavor !== undefined && { flavor }) }));

  // Opt-out content
  const table = features.content?.table;
  if (table !== false) {
    const tableOptions = typeof table === "object" ? table : {};
    extensions.push(...createVizelTableExtensions(tableOptions));
  }

  // Opt-out / opt-in features
  addSlashMenuExtension(extensions, features);
  addImageExtension(extensions, features, onError);
  addTaskListExtension(extensions, features);
  addCharacterCountExtension(extensions, features);
  addTextColorExtension(extensions, features);
  addHighlightExtension(extensions, features);
  addMathematicsExtension(extensions, features);
  addDragHandleExtension(extensions, features, locale);
  addDetailsExtension(extensions, features);
  addCalloutExtension(extensions, features, flavorConfig);
  addEmbedExtension(extensions, features, encoding?.embed);
  addDiagramExtension(extensions, features);
  addTableOfContentsExtension(extensions, features);
  addWikiLinkExtension(extensions, features, flavorConfig, encoding?.wikiLink);
  addMentionExtension(extensions, features, encoding?.mention);
  addCommentsExtension(extensions, features);
  addPresenceExtension(extensions, features);

  // Marks (default on, opt-out via content.*)
  if (features.content?.underline !== false) {
    extensions.push(Underline);
  }
  if (features.content?.superscript !== false) {
    extensions.push(Superscript);
  }
  if (features.content?.subscript !== false) {
    extensions.push(Subscript);
  }
  const typography = features.interaction?.typography;
  if (typography !== false) {
    const typographyOptions = typeof typography === "object" ? typography : {};
    extensions.push(createVizelTypographyExtension(typographyOptions));
  }

  // CodeBlock (always-on, async — lowlight is loaded dynamically)
  await addCodeBlockExtension(extensions, locale);

  return extensions;
}
