import { type MarkdownExtensionOptions, Markdown as TiptapMarkdown } from "@tiptap/markdown";

/**
 * Configuration options for the Markdown extension
 */
export interface VizelMarkdownOptions {
  /**
   * Configure indentation for markdown output
   * @default { style: 'space', size: 2 }
   */
  indentation?: MarkdownExtensionOptions["indentation"];
  /**
   * Enable GitHub Flavored Markdown
   * @default true
   */
  gfm?: boolean;
  /**
   * Convert newlines to <br> tags
   * @default false
   */
  breaks?: boolean;
}

/**
 * Create a configured Markdown extension.
 *
 * The Markdown extension provides bidirectional conversion between
 * Markdown syntax and the editor's document structure.
 *
 * ## Import Markdown
 * ```typescript
 * editor.commands.setContent('# Hello\n\nWorld', { contentType: 'markdown' })
 * ```
 *
 * ## Export Markdown
 * ```typescript
 * const markdown = editor.getMarkdown()
 * ```
 *
 * ## Parse/Serialize
 * ```typescript
 * const json = editor.markdown.parse('# Hello')
 * const md = editor.markdown.serialize(json)
 * ```
 *
 * @example Basic usage
 * ```typescript
 * import { Markdown } from '@vizel/core'
 *
 * const editor = new Editor({
 *   extensions: [Markdown],
 * })
 * ```
 *
 * @example With options
 * ```typescript
 * import { createMarkdownExtension } from '@vizel/core'
 *
 * const editor = new Editor({
 *   extensions: [
 *     createMarkdownExtension({
 *       gfm: true,
 *       indentation: { style: 'tab', size: 1 },
 *     }),
 *   ],
 * })
 * ```
 */
export function createMarkdownExtension(
  options: VizelMarkdownOptions = {}
): ReturnType<typeof TiptapMarkdown.configure> {
  const { indentation = { style: "space", size: 2 }, gfm = true, breaks = false } = options;

  const markedOptions: MarkdownExtensionOptions["markedOptions"] = {
    gfm,
    breaks,
  };

  return TiptapMarkdown.configure({
    indentation,
    markedOptions,
  });
}

/**
 * Pre-configured Markdown extension with default settings.
 *
 * Uses:
 * - Space indentation (2 spaces)
 * - GitHub Flavored Markdown enabled
 * - No automatic line breaks
 */
export const Markdown = createMarkdownExtension();

// Re-export the extension type for advanced usage
export { TiptapMarkdown };
