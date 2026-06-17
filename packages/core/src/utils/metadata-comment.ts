/**
 * Escape and unescape values carried inside a `vizel:` metadata comment.
 *
 * The embed and wiki-link extensions both encode lossless metadata in an
 * HTML comment (`<!-- vizel:embed ... -->`, `<!-- vizel:wikiLink ... -->`).
 * Both round-trip their attribute values through the same escaping, so the
 * two functions live here once.
 */

/**
 * Escape a value for inclusion inside a `vizel:` metadata comment.
 *
 * Order matters: `&` is escaped first so subsequent replacements do not
 * double-escape ampersand-introduced entities. The literal `-->` sequence
 * becomes `--&gt;` so the value cannot prematurely close the host HTML
 * comment or collide with the attribute delimiter.
 */
export function escapeMetadataCommentValue(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/-->/g, "--&gt;");
}

/**
 * Decode a value previously escaped by {@link escapeMetadataCommentValue}.
 *
 * Reverse the same replacements in inverse order so the original characters
 * are restored verbatim on parse.
 */
export function unescapeMetadataCommentValue(value: string): string {
  return value
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}
