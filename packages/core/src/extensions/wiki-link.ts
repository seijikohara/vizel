import { InputRule, Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

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

            const target = event.target as HTMLElement;
            const link = target.closest("a[data-wiki-link]");
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
});

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
  return VizelWikiLink.configure(options);
}
