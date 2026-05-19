import { InputRule, Mark, mergeAttributes } from "@tiptap/core";
import type { Mark as PMMark, Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type MarkdownIt from "markdown-it";
import type { MarkdownSerializerState } from "prosemirror-markdown";

// =============================================================================
// Types
// =============================================================================

/**
 * Suggestion item for wiki link autocomplete
 */
export interface VizelWikiLinkSuggestion {
  /** Page name */
  name: string;
  /** Optional display label (defaults to name) */
  label?: string;
}

/**
 * Options for the Wiki Link extension
 */
export interface VizelWikiLinkOptions {
  /**
   * Resolve a page name to a URL.
   * Called when rendering the link in the editor.
   * @default (pageName) => `#${pageName}`
   */
  resolveLink?: (pageName: string) => string;

  /**
   * Check if a page exists. Used for visual differentiation
   * between existing and non-existing pages.
   * @default () => true
   */
  pageExists?: (pageName: string) => boolean;

  /**
   * Get page suggestions for autocomplete.
   * Return an empty array to disable autocomplete.
   */
  getPageSuggestions?: (query: string) => VizelWikiLinkSuggestion[];

  /**
   * Callback when a wiki link is clicked.
   * If not provided, the default browser navigation is used.
   */
  onLinkClick?: (pageName: string, event: MouseEvent) => void;

  /**
   * CSS class for existing page links.
   * @default "vizel-wiki-link--existing"
   */
  existingClass?: string;

  /**
   * CSS class for non-existing page links.
   * @default "vizel-wiki-link--new"
   */
  newClass?: string;

  /**
   * Additional HTML attributes to add to wiki links.
   */
  HTMLAttributes?: Record<string, unknown>;

  /**
   * Whether to serialize wiki links as `[[page]]` syntax in Markdown output.
   * When `false`, wiki links are serialized as standard Markdown links `[text](wiki://page)`.
   * Set automatically by `createVizelExtensions()` based on the editor's flavor:
   * - `true` for Obsidian flavor
   * - `false` for all other flavors
   * @default false
   */
  serializeAsWikiLink?: boolean;
}

// =============================================================================
// Plugin Key
// =============================================================================

/**
 * Plugin key for accessing Wiki Link plugin state
 */
export const vizelWikiLinkPluginKey = new PluginKey("vizelWikiLink");

// =============================================================================
// Module Augmentation
// =============================================================================

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    wikiLink: {
      /** Insert a wiki link at the current position */
      setWikiLink: (pageName: string, displayText?: string) => ReturnType;
      /** Remove wiki link mark from the current selection */
      unsetWikiLink: () => ReturnType;
    };
  }
}

// =============================================================================
// Mark Extension
// =============================================================================

/**
 * Wiki Link mark extension for Vizel editor.
 *
 * Supports `[[page-name]]` and `[[page-name|display text]]` syntax.
 * Links are rendered with visual differentiation for existing vs non-existing pages.
 *
 * @example
 * ```typescript
 * import { VizelWikiLink } from "@vizel/core";
 *
 * const editor = new Editor({
 *   extensions: [
 *     VizelWikiLink.configure({
 *       resolveLink: (page) => `/wiki/${encodeURIComponent(page)}`,
 *       pageExists: (page) => knownPages.has(page),
 *     }),
 *   ],
 * });
 * ```
 */
export const VizelWikiLink = Mark.create<VizelWikiLinkOptions>({
  name: "wikiLink",

  priority: 1001,

  addOptions() {
    return {
      resolveLink: (pageName: string) => `#${pageName}`,
      pageExists: () => true,
      existingClass: "vizel-wiki-link--existing",
      newClass: "vizel-wiki-link--new",
      HTMLAttributes: {},
      serializeAsWikiLink: false,
    };
  },

  addAttributes() {
    return {
      pageName: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-wiki-page"),
        renderHTML: (attributes) => ({
          "data-wiki-page": attributes.pageName as string,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[data-wiki-link]",
      },
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const pageName = (mark.attrs.pageName as string) ?? "";
    const href = this.options.resolveLink?.(pageName) ?? `#${pageName}`;
    const exists = this.options.pageExists?.(pageName) ?? true;
    const statusClass = exists ? this.options.existingClass : this.options.newClass;

    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes ?? {}, HTMLAttributes, {
        class: `vizel-wiki-link ${statusClass}`,
        href,
        "data-wiki-link": "",
        "data-wiki-page": pageName,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setWikiLink:
        (pageName: string, displayText?: string) =>
        ({ editor }) => {
          const text = displayText ?? pageName;
          return editor
            .chain()
            .insertContent({
              type: "text",
              text,
              marks: [{ type: this.name, attrs: { pageName } }],
            })
            .run();
        },
      unsetWikiLink:
        () =>
        ({ editor }) => {
          return editor.chain().unsetMark(this.name).run();
        },
    };
  },

  addInputRules() {
    // Match [[page-name]] or [[page-name|display text]]
    const wikiLinkRegex = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]$/;

    return [
      new InputRule({
        find: wikiLinkRegex,
        handler: ({ state, range, match }) => {
          const rawPageName = match[1];
          if (!rawPageName) return;
          const pageName = rawPageName.trim();
          const displayText = match[2]?.trim() ?? pageName;

          const { tr } = state;
          const markType = state.schema.marks[this.name];

          if (!markType) return;

          const mark = markType.create({ pageName });

          tr.replaceWith(range.from, range.to, state.schema.text(displayText, [mark]));
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    const { onLinkClick } = this.options;

    return [
      new Plugin({
        key: vizelWikiLinkPluginKey,
        props: {
          handleClick: (_view, _pos, event) => {
            if (!onLinkClick) return false;

            if (!(event.target instanceof HTMLElement)) return false;
            const link = event.target.closest("a[data-wiki-link]");
            if (!link) return false;

            const pageName = link.getAttribute("data-wiki-page");
            if (!pageName) return false;

            event.preventDefault();
            onLinkClick(pageName, event);
            return true;
          },
        },
      }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize: {
          open(_state: MarkdownSerializerState, _mark: PMMark) {
            return `[`;
          },
          close(_state: MarkdownSerializerState, mark: PMMark) {
            const pageName = String(mark.attrs?.pageName ?? "");
            return `](wiki://${encodeURIComponent(pageName)})`;
          },
        },
        parse: {
          setup(md: MarkdownIt) {
            registerWikiLinkRule(md);
          },
        },
      },
    };
  },
});

/**
 * Register a markdown-it inline rule for `[[page]]` and
 * `[[page|display]]` wiki-link syntax.
 */
function registerWikiLinkRule(md: MarkdownIt): void {
  md.inline.ruler.before("link", "vizel_wiki_link", (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x5b) return false;
    if (state.src.charCodeAt(state.pos + 1) !== 0x5b) return false;
    const rest = state.src.slice(state.pos);
    const match = /^\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/.exec(rest);
    if (!match) return false;
    const pageName = (match[1] ?? "").trim();
    const displayText = (match[2] ?? pageName).trim();
    if (!pageName) return false;
    if (!silent) {
      const token = state.push("vizel_wiki_link", "a", 0);
      token.content = displayText;
      token.meta = { pageName };
    }
    state.pos += match[0].length;
    return true;
  });

  md.renderer.rules.vizel_wiki_link = (tokens, idx) => {
    const token = tokens[idx];
    const pageName = String((token?.meta as { pageName?: string } | undefined)?.pageName ?? "");
    const escapedPage = pageName.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const text = (token?.content ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<a data-wiki-link="" data-wiki-page="${escapedPage}" href="#${escapedPage}">${text}</a>`;
  };
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a configured Wiki Link extension for Vizel editor.
 *
 * Wiki links use `[[page-name]]` syntax for linking between pages.
 * Supports display text aliases with `[[page-name|display text]]`.
 *
 * @example Basic usage
 * ```typescript
 * const extension = createVizelWikiLinkExtension();
 * ```
 *
 * @example With custom link resolution
 * ```typescript
 * const extension = createVizelWikiLinkExtension({
 *   resolveLink: (page) => `/wiki/${encodeURIComponent(page)}`,
 *   pageExists: (page) => pages.has(page),
 *   onLinkClick: (page) => router.push(`/wiki/${page}`),
 * });
 * ```
 *
 * @example With autocomplete
 * ```typescript
 * const extension = createVizelWikiLinkExtension({
 *   getPageSuggestions: (query) =>
 *     allPages
 *       .filter((p) => p.toLowerCase().includes(query.toLowerCase()))
 *       .map((name) => ({ name })),
 * });
 * ```
 */
export function createVizelWikiLinkExtension(options: VizelWikiLinkOptions = {}) {
  const serializeAsWikiLink = options.serializeAsWikiLink ?? false;

  // Override the markdown serialize spec to honor the flavor-specific
  // wiki-link policy. Obsidian uses `[[page]]`; other flavors fall back
  // to a standard markdown link with the `wiki://` URI scheme so the
  // distinction round-trips through plain markdown consumers.
  return VizelWikiLink.extend({
    addStorage() {
      return {
        markdown: {
          serialize: serializeAsWikiLink
            ? {
                open(_state: MarkdownSerializerState, mark: PMMark, parent: PMNode, index: number) {
                  const pageName = String(mark.attrs?.pageName ?? "");
                  const childText = parent.child(index).textContent;
                  // Obsidian emits `[[page]]` when the display text matches
                  // the page name; otherwise `[[page|text]]`. The opening
                  // delimiter cannot be finalized without peeking at the
                  // marked text node, so the same node is consulted here.
                  return childText === pageName ? `[[` : `[[${pageName}|`;
                },
                close(_state: MarkdownSerializerState, _mark: PMMark) {
                  return `]]`;
                },
              }
            : {
                open(_state: MarkdownSerializerState, _mark: PMMark) {
                  return `[`;
                },
                close(_state: MarkdownSerializerState, mark: PMMark) {
                  const pageName = String(mark.attrs?.pageName ?? "");
                  return `](wiki://${encodeURIComponent(pageName)})`;
                },
              },
          parse: {
            setup(md: MarkdownIt) {
              registerWikiLinkRule(md);
            },
          },
        },
      };
    },
  }).configure(options);
}
