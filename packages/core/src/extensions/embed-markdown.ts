/**
 * Embed Markdown metadata encoding and markdown-it parse rule.
 *
 * Pure helpers extracted from the embed extension. They encode and recover
 * the lossless `<!-- vizel:embed key="value" -->` metadata comment and
 * register the markdown-it inline rule that recognizes it. No DOM access.
 */

import type MarkdownIt from "markdown-it";

import { unescapeMetadataCommentValue } from "../utils/metadata-comment.ts";

/**
 * Parse the attribute list of a `<!-- vizel:embed key="value" -->`
 * comment into a plain object. Values are unescaped via
 * {@link unescapeMetadataCommentValue}.
 */
function parseEmbedMetadataAttrs(attrsSrc: string): Record<string, string> {
  const result: Record<string, string> = {};
  const attrRegex = /([A-Za-z_][\w-]*)="([^"]*)"/g;
  for (const match of attrsSrc.matchAll(attrRegex)) {
    const key = match[1];
    const value = match[2];
    if (key === undefined || value === undefined) continue;
    result[key] = unescapeMetadataCommentValue(value);
  }
  return result;
}

/**
 * Inline regex matching `[text](url)<!-- vizel:embed key="value" ... -->`.
 * Group 1 captures the link text, group 2 captures the URL, group 3
 * captures the comment body up to the terminating `-->`.
 */
const VIZEL_EMBED_METADATA_PATTERN =
  /^\[([^\]]*)\]\(([^)\s]+)\)<!--\s*vizel:embed\s+([\s\S]*?)\s*-->/;

/**
 * Register a markdown-it inline rule that recognizes the
 * `[title](url)<!-- vizel:embed ... -->` pattern and emits a single
 * `vizel_embed` token carrying the recovered attributes. The rule
 * runs before `link` so the link parser never gets a chance to
 * consume the visible portion in isolation.
 */
export function registerEmbedRule(md: MarkdownIt): void {
  md.inline.ruler.before("link", "vizel_embed", (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x5b) return false;
    const rest = state.src.slice(state.pos);
    const match = VIZEL_EMBED_METADATA_PATTERN.exec(rest);
    if (!match) return false;
    const title = match[1] ?? "";
    const url = match[2] ?? "";
    const attrsSrc = match[3] ?? "";
    if (!url) return false;
    if (!silent) {
      const attrs = parseEmbedMetadataAttrs(attrsSrc);
      const token = state.push("vizel_embed", "div", 0);
      token.content = title;
      token.meta = { url, attrs };
    }
    state.pos += match[0].length;
    return true;
  });

  md.renderer.rules.vizel_embed = (tokens, idx) => {
    const token = tokens[idx];
    const meta = (token?.meta as { url?: string; attrs?: Record<string, string> } | undefined) ?? {
      url: "",
      attrs: {},
    };
    const url = meta.url ?? "";
    const attrs = meta.attrs ?? {};
    const title = token?.content ?? "";
    const escapedUrl = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const titleAttr = attrs.title ?? title;
    const escapedTitle = titleAttr.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const dataAttrs = Object.entries(attrs)
      .filter(([key]) => key !== "title")
      .map(
        ([key, value]) =>
          ` data-embed-${key}="${value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`
      )
      .join("");
    return `<div data-vizel-embed="true" data-embed-url="${escapedUrl}" data-embed-title="${escapedTitle}"${dataAttrs}></div>`;
  };
}
