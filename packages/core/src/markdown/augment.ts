/**
 * Module augmentation that makes the Markdown extension's runtime
 * surface available on the `Editor` type unconditionally.
 *
 * Vizel always installs the Markdown extension as part of the always-on
 * core, so consumers can call `editor.getMarkdown()` and
 * `editor.markdown.parse(md)` without a capability check. This file
 * declares the augmentation; the runtime
 * implementation lives in `extensions/markdown.ts` via the
 * `tiptap-markdown` extension's `onBeforeCreate` hook plus a per-editor
 * wrapper that pins `editor.markdown` / `editor.getMarkdown`.
 *
 * Import this module for its side effect from
 * `packages/core/src/index.ts` so the augmentation always loads.
 */

import type { JSONContent } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Editor {
    /** Serialize the current document to a Markdown string. */
    getMarkdown(): string;
    /** Markdown parser surface attached by the Vizel Markdown extension. */
    markdown: {
      /** Parse a Markdown string into a Tiptap JSON document. */
      parse(md: string): JSONContent;
    };
  }
}

// Re-export a no-op symbol so this module participates in the import graph
// when consumers only need the side-effect augmentation.
export const VIZEL_MARKDOWN_AUGMENT_LOADED = true;
