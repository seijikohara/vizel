import type { JSONContent } from "@tiptap/core";

/**
 * Minimal subset of the markdown-it parser instance that flavor
 * plugins interact with at registration time.
 *
 * Defined locally so consumers do not need `@types/markdown-it`
 * installed to author a flavor plugin. When the eventual library
 * swap (Section 10b) wires the real markdown-it instance through,
 * `markdownItPlugins` callbacks receive the full markdown-it API —
 * the structural type below covers the `.use()` registration that
 * every plugin needs, and any narrower call is available via a
 * `(md as any).foo()` cast inside the callback.
 */
export interface VizelMarkdownItInstance {
  // biome-ignore lint/suspicious/noExplicitAny: structural placeholder mirrors markdown-it's open plugin signature
  use(plugin: (...args: any[]) => void, ...params: unknown[]): VizelMarkdownItInstance;
}

/**
 * Serializer hook for a Tiptap node type.
 *
 * Receives the node's JSON representation and returns a markdown
 * string for that node. Surrounding state (current depth, list
 * markers, etc.) is supplied via the markdown-it / prosemirror-markdown
 * state object the runtime hands off; flavor authors who need that
 * state should use the lower-level `tiptap-markdown` integration
 * directly and pass through `serialize` on the underlying extension.
 */
export type VizelNodeSerializer = (node: JSONContent) => string;

/**
 * Serializer hook for a Tiptap mark type.
 *
 * Receives the marked text and returns the markdown string that
 * wraps that text (e.g. `_foo_` for italic). Plain-text content is
 * passed in — the serializer adds the wrapping syntax.
 */
export type VizelMarkSerializer = (text: string) => string;

/**
 * First-class Markdown flavor plugin.
 *
 * A flavor bundles three concerns:
 *
 * - **`markdownItPlugins`** — registered against the parser instance so
 *   the flavor recognizes its source-syntax extensions on input.
 * - **`nodeSerializers` / `markSerializers`** — override the default
 *   markdown serialization of named Tiptap node / mark types so the
 *   flavor controls its output syntax.
 * - **`config`** — ambient configuration consumed by extensions that
 *   need flavor-specific tuning (e.g. callout output style, wiki-link
 *   bracket style).
 *
 * Vizel ships five built-in flavors as `VizelMarkdownFlavor` instances:
 * `vizelCommonMarkFlavor`, `vizelGfmFlavor`, `vizelObsidianFlavor`,
 * `vizelDocusaurusFlavor`, `vizelPandocFlavor`. Compose them with
 * {@link composeVizelMarkdownFlavors} to derive a custom flavor.
 *
 * @example
 * ```ts
 * import { composeVizelMarkdownFlavors, vizelGfmFlavor } from "@vizel/core";
 * import footnote from "markdown-it-footnote";
 *
 * const myFlavor = composeVizelMarkdownFlavors(
 *   [
 *     vizelGfmFlavor,
 *     { name: "footnote", markdownItPlugins: [(md) => md.use(footnote)] },
 *   ],
 *   "gfm-with-footnotes"
 * );
 * ```
 */
export interface VizelMarkdownFlavor {
  /** Stable identifier for the flavor (e.g. `"gfm"`). */
  readonly name: string;
  /**
   * Plugins applied to the parser's MarkdownIt instance, in order.
   * Use this to extend the parser with new source-syntax recognizers.
   */
  readonly markdownItPlugins?: readonly ((md: VizelMarkdownItInstance) => void)[];
  /**
   * Per-node serializer overrides keyed by Tiptap node type name.
   * Later flavors override earlier ones when composed.
   */
  readonly nodeSerializers?: Readonly<Record<string, VizelNodeSerializer>>;
  /**
   * Per-mark serializer overrides keyed by Tiptap mark type name.
   * Later flavors override earlier ones when composed.
   */
  readonly markSerializers?: Readonly<Record<string, VizelMarkSerializer>>;
  /**
   * Ambient configuration consumed by flavor-aware extensions.
   * Later flavors shallow-merge over earlier ones when composed.
   */
  readonly config?: Readonly<Record<string, unknown>>;
}

/**
 * Encoding mode for nodes that lack a clean markdown representation.
 *
 * `"default"` chooses the lossy-but-portable encoding (plain `@mention`,
 * markdown link for `embed`, flavor-default for `wikiLink`).
 * `"metadata-comment"` chooses the lossless-but-noisy encoding that
 * preserves identifiers via an HTML comment trailing the node.
 */
export type VizelMarkdownLossyEncodingMode = "default" | "metadata-comment";

/**
 * Per-node encoding mode map.
 *
 * Keys correspond to the lossy node types listed in spec Section 10
 * (`embed`, `mention`, `wikiLink`). Other node types are unaffected
 * and follow the flavor's serializer hooks.
 */
export interface VizelMarkdownEncodingOptions {
  readonly embed?: VizelMarkdownLossyEncodingMode;
  readonly mention?: VizelMarkdownLossyEncodingMode;
  readonly wikiLink?: VizelMarkdownLossyEncodingMode;
}
