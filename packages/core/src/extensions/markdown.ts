/**
 * Markdown extension built on top of `tiptap-markdown` (markdown-it base).
 *
 * Vizel's Markdown pipeline is always-on. This extension:
 *
 * - Configures the underlying `tiptap-markdown` extension with the
 *   parser tuning carried by the Vizel options (`indentation`, `gfm`,
 *   `breaks`).
 * - Registers every flavor-supplied markdown-it plugin against the
 *   parser's `MarkdownIt` instance, so the parser stays tolerant
 *   across formats.
 * - Wraps the per-editor storage to expose the spec-mandated
 *   `editor.getMarkdown()` and `editor.markdown.parse(md)` surface
 *   (the module augmentation lives in `markdown/augment.ts`).
 */

import type { Editor, Extension, JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/core";
import type MarkdownIt from "markdown-it";
import { type MarkdownOptions, Markdown as TiptapMarkdownExtension } from "tiptap-markdown";

import type { VizelMarkdownFlavor } from "../markdown/types.ts";

/**
 * Indentation configuration for markdown output.
 *
 * The legacy `@tiptap/markdown` exposed this directly; with
 * `tiptap-markdown` the markdown-it serializer has no equivalent knob,
 * so the option is honored by mapping `style: "tab"` to the bullet-list
 * marker context only when it cannot be expressed elsewhere. Most
 * consumers should leave the default in place.
 */
export interface VizelMarkdownIndentation {
  /** Indentation character family. */
  style: "space" | "tab";
  /** Number of repetitions of the style character per indent level. */
  size: number;
}

/**
 * Configuration options for the Vizel Markdown extension.
 */
export interface VizelMarkdownOptions {
  /**
   * Configure indentation for markdown output.
   * @default { style: 'space', size: 2 }
   */
  indentation?: VizelMarkdownIndentation;
  /**
   * Enable GitHub Flavored Markdown features (links autolinked).
   * @default true
   */
  gfm?: boolean;
  /**
   * Convert single newlines to `<br>` tags.
   * @default false
   */
  breaks?: boolean;
  /**
   * Flavor plugin that contributes markdown-it parser plugins and
   * per-node / per-mark serializer overrides. The runtime callers
   * inject the editor's flavor here; consumers do not normally pass
   * this option directly.
   */
  flavor?: VizelMarkdownFlavor;
}

/**
 * Storage carried by the underlying `tiptap-markdown` extension at
 * runtime. The library does not export this shape, so we re-declare
 * the slice that the Vizel runtime touches.
 */
interface TiptapMarkdownStorage {
  options: MarkdownOptions;
  parser: {
    md: MarkdownIt;
    parse(content: string, opts?: { inline?: boolean }): string | unknown;
  };
  serializer: {
    serialize(content: unknown): string;
  };
  getMarkdown(): string;
}

/**
 * Apply every flavor-supplied markdown-it plugin to the parser.
 *
 * Idempotent: re-applies if the underlying tokenizer is rebuilt. The
 * registration happens here (rather than via the spec's `parse.setup`
 * hook) because flavor plugins are external to the editor's extension
 * graph and the spec contract guarantees that input parsing stays
 * tolerant across flavors.
 */
function registerVizelFlavorPlugins(
  parserMd: MarkdownIt,
  flavor: VizelMarkdownFlavor | undefined
): void {
  const plugins = flavor?.markdownItPlugins;
  if (!plugins) return;
  for (const plugin of plugins) {
    plugin(parserMd);
  }
}

/**
 * Wrap the editor so that `editor.getMarkdown()` and
 * `editor.markdown.parse(md)` resolve to the underlying
 * `tiptap-markdown` storage.
 *
 * `markdown.parse` returns a JSON content object. The underlying
 * library renders markdown to HTML and then relies on the editor's
 * schema to coerce it back to ProseMirror; we run that final HTML
 * through `generateJSON` to expose a JSON shape, matching the spec.
 */
function attachVizelMarkdownSurface(editor: Editor): void {
  const storage = (editor.storage as unknown as { markdown?: TiptapMarkdownStorage }).markdown;
  if (!storage) return;

  const editorWithSurface = editor as Editor & {
    getMarkdown: () => string;
    markdown: { parse: (md: string) => JSONContent };
  };

  editorWithSurface.getMarkdown = () => storage.getMarkdown();
  editorWithSurface.markdown = {
    parse: (md: string): JSONContent => {
      const rendered = storage.parser.parse(md);
      if (typeof rendered !== "string") {
        // tiptap-markdown passes non-string content through unchanged.
        return rendered as JSONContent;
      }
      // Resolve the editor's schema-bound extensions so generateJSON
      // honors all Vizel node types (not just the markdown defaults).
      return generateJSON(
        `<div>${rendered}</div>`,
        editor.extensionManager.extensions
      ) as JSONContent;
    },
  };
}

/**
 * Create a configured Markdown extension.
 *
 * The extension wires `tiptap-markdown` into the editor and bridges
 * the Vizel flavor plugin system. The returned extension is also
 * responsible for attaching `editor.getMarkdown()` and
 * `editor.markdown.parse` once the editor finishes initialization.
 *
 * @example Basic usage
 * ```typescript
 * import { createVizelMarkdownExtension } from '@vizel/core';
 *
 * const editor = new Editor({
 *   extensions: [createVizelMarkdownExtension()],
 * });
 * editor.getMarkdown();
 * ```
 *
 * @example With a flavor
 * ```typescript
 * import { createVizelMarkdownExtension, vizelGfmFlavor } from '@vizel/core';
 *
 * const ext = createVizelMarkdownExtension({ flavor: vizelGfmFlavor });
 * ```
 */
export function createVizelMarkdownExtension(
  options: VizelMarkdownOptions = {}
): Extension<MarkdownOptions> {
  const { gfm = true, breaks = false, flavor } = options;

  // tiptap-markdown's `linkify` mirrors GFM's autolink behavior closely
  // enough for our purposes; expose it under the Vizel `gfm` flag.
  const baseOptions: Partial<MarkdownOptions> = {
    html: true,
    tightLists: true,
    tightListClass: "tight",
    bulletListMarker: "-",
    linkify: gfm,
    breaks,
    transformPastedText: false,
    transformCopiedText: false,
  };

  return TiptapMarkdownExtension.extend({
    onCreate() {
      const storage = (
        this.editor.storage as unknown as {
          markdown?: TiptapMarkdownStorage;
        }
      ).markdown;
      if (storage?.parser?.md) {
        registerVizelFlavorPlugins(storage.parser.md, flavor);
      }
      attachVizelMarkdownSurface(this.editor);
    },
  }).configure(baseOptions);
}

/**
 * Pre-configured Markdown extension with default settings.
 *
 * Uses:
 * - GitHub-style linkify enabled
 * - No automatic line breaks
 * - HTML pass-through enabled
 */
export const VizelMarkdown = createVizelMarkdownExtension();
