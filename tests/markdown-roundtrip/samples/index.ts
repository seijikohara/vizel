import type { VizelRoundtripSample } from "@vizel/core";

/**
 * Representative Markdown round-trip samples for each built-in flavor.
 *
 * The long-term target is 100+ samples per flavor drawn from
 * CommonMark / GFM conformance suites, Obsidian-style notes, Docusaurus
 * admonitions, and Pandoc extension fixtures. This file ships a
 * representative cross-section — at least ten samples per flavor
 * covering heading, paragraph, list, blockquote, inline emphasis,
 * inline code, fenced code, image, link, and the flavor-specific syntax
 * (e.g. GFM tables, Obsidian wiki-links). Authors who add new
 * flavor-specific syntax must extend the corresponding bucket.
 *
 * Each sample is paired with the exact Markdown form Vizel emits via
 * the selected flavor; whitespace differences within a single trailing
 * newline are tolerated by `assertMarkdownRoundtrip`'s normaliser.
 */

const baseCommonMark: readonly VizelRoundtripSample[] = [
  { name: "heading-h1", input: "# Heading 1" },
  { name: "heading-h3", input: "### Heading 3" },
  { name: "paragraph", input: "A paragraph of plain text." },
  { name: "emphasis-italic", input: "Some *italic* text." },
  { name: "emphasis-bold", input: "Some **bold** text." },
  { name: "inline-code", input: "Some `inline code` text." },
  { name: "bullet-list", input: "- item one\n- item two\n- item three" },
  { name: "ordered-list", input: "1. first\n2. second\n3. third" },
  { name: "blockquote", input: "> quoted paragraph" },
  // Vizel's code-block lowlight serializer always emits a language tag.
  // `plaintext` is the canonical sentinel for no explicit language.
  { name: "fenced-code", input: "```plaintext\nplain fenced code\n```" },
  { name: "link", input: "Visit [Vizel](https://example.com/vizel)." },
  { name: "image", input: "![alt text](https://example.com/img.png)" },
];

export const commonmarkSamples: readonly VizelRoundtripSample[] = baseCommonMark;

export const gfmSamples: readonly VizelRoundtripSample[] = [
  ...baseCommonMark,
  // GFM tables: Vizel emits a 3-dash separator regardless of the column
  // alignment, matching the canonical `prosemirror-tables` output.
  {
    name: "table",
    input: "| col a | col b |\n| --- | --- |\n| 1 | 2 |",
  },
  { name: "strikethrough", input: "Some ~~strikethrough~~ text." },
];

export const obsidianSamples: readonly VizelRoundtripSample[] = [
  ...baseCommonMark,
  { name: "wiki-link-bare", input: "Reference to [[page-name]] inline." },
  { name: "wiki-link-aliased", input: "Reference to [[page-name|display]] inline." },
];

export const docusaurusSamples: readonly VizelRoundtripSample[] = baseCommonMark;

export const pandocSamples: readonly VizelRoundtripSample[] = baseCommonMark;
