/**
 * Callout / Admonition Extension
 *
 * Provides callout blocks for informational content (info, warning, danger, tip, note).
 * Supports multiple Markdown flavors for input and output:
 * - Directives: `:::type ... :::`
 * - GitHub Alerts: `> [!TYPE]`
 * - Obsidian Callouts: `> [!type]`
 * - CommonMark fallback: `> **Type**: content`
 *
 * Input parsing is always tolerant (all formats recognized).
 * Output format is controlled by the `markdownFormat` option.
 */

import type {
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownParseResult,
  MarkdownToken,
} from "@tiptap/core";
import { Node } from "@tiptap/core";
import type { VizelCalloutMarkdownFormat } from "../utils/markdown-flavors.ts";

/**
 * Available callout types
 */
export type VizelCalloutType = "info" | "warning" | "danger" | "tip" | "note";

const VIZEL_CALLOUT_TYPES: ReadonlySet<string> = new Set<VizelCalloutType>([
  "info",
  "warning",
  "danger",
  "tip",
  "note",
]);

const isVizelCalloutType = (value: string): value is VizelCalloutType =>
  VIZEL_CALLOUT_TYPES.has(value);

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Wrap the current selection in a callout block
       */
      setCallout: (attributes?: { type?: VizelCalloutType }) => ReturnType;
      /**
       * Toggle a callout block around the current selection
       */
      toggleCallout: (attributes?: { type?: VizelCalloutType }) => ReturnType;
      /**
       * Lift content out of a callout block
       */
      unsetCallout: () => ReturnType;
      /**
       * Change the type of the current callout
       */
      setCalloutType: (type: VizelCalloutType) => ReturnType;
    };
  }
}

/**
 * Options for the Callout extension
 */
export interface VizelCalloutOptions {
  /**
   * HTML attributes to add to the callout element
   */
  HTMLAttributes?: Record<string, unknown>;
  /**
   * Markdown output format for callout serialization.
   *
   * When using `createVizelExtensions()`, this is set automatically based on the editor's
   * `flavor` setting (e.g. `"gfm"` → `"github-alerts"`, `"obsidian"` → `"obsidian-callouts"`).
   * When using `VizelCallout` directly, defaults to `"directives"`.
   */
  markdownFormat?: VizelCalloutMarkdownFormat;
}

// ─── Type mappings ──────────────────────────────────────────────────────────

/** Map Vizel callout types to GitHub Alert types (UPPER_CASE) */
const VIZEL_TO_GITHUB_ALERT: Record<VizelCalloutType, string> = {
  note: "NOTE",
  info: "NOTE",
  tip: "TIP",
  warning: "WARNING",
  danger: "CAUTION",
};

/** Map GitHub Alert types to Vizel callout types */
const GITHUB_ALERT_TO_VIZEL: Record<string, VizelCalloutType> = {
  NOTE: "note",
  TIP: "tip",
  IMPORTANT: "info",
  WARNING: "warning",
  CAUTION: "danger",
};

/**
 * Parse an alert/callout type string to a Vizel callout type.
 * Handles GitHub Alerts (UPPER_CASE), Obsidian (lowercase), and directives.
 */
function parseCalloutType(raw: string): VizelCalloutType {
  const upper = raw.toUpperCase();
  const fromAlert = GITHUB_ALERT_TO_VIZEL[upper];
  if (fromAlert) {
    return fromAlert;
  }
  const lower = raw.toLowerCase();
  if (isVizelCalloutType(lower)) {
    return lower;
  }
  return "info";
}

/**
 * Strip blockquote prefix (`> `) from each line of content.
 */
function stripBlockquotePrefix(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^> ?/, ""))
    .join("\n")
    .trim();
}

/**
 * Add blockquote prefix (`> `) to each line of content.
 */
function addBlockquotePrefix(text: string): string {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

// ─── Tokenizer patterns ────────────────────────────────────────────────────

/** Directives: `:::type\ncontent\n:::` */
const DIRECTIVE_REGEX = /^:::(\w+)\n([\s\S]*?)\n:::\n?/;

/**
 * GitHub Alerts / Obsidian Callouts: `> [!TYPE]\n> content`
 * Matches:
 * - `> [!NOTE]` (GitHub)
 * - `> [!note]` (Obsidian)
 * - `> [!Warning]` (mixed case)
 * Content continues as long as lines start with `>`
 */
const ALERT_REGEX = /^> \[!(\w+)\]\n((?:>[ \t]?.*(?:\n|$))*)/;

/**
 * The Callout node extension.
 *
 * @example
 * ```typescript
 * import { VizelCallout } from '@vizel/core'
 *
 * const editor = new Editor({
 *   extensions: [VizelCallout],
 * })
 *
 * // Insert a callout
 * editor.commands.setCallout({ type: 'info' })
 * ```
 */
export const VizelCallout = Node.create<VizelCalloutOptions>({
  name: "callout",

  group: "block",

  content: "block+",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      markdownFormat: "directives" satisfies VizelCalloutMarkdownFormat,
    };
  },

  addAttributes() {
    return {
      type: {
        default: "info" satisfies VizelCalloutType,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("data-type") ?? "";
          return isVizelCalloutType(raw) ? raw : "info";
        },
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-type": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        "data-callout": "",
        class: `vizel-callout vizel-callout--${HTMLAttributes["data-type"] || "info"}`,
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
      },
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attributes?: { type?: VizelCalloutType }) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes?: { type?: VizelCalloutType }) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
      setCalloutType:
        (type: VizelCalloutType) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { type });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Allow backspace at start of callout to lift content out
      Backspace: ({ editor }) => {
        const { $from } = editor.state.selection;
        const isAtStart = $from.parentOffset === 0;
        if (!isAtStart) return false;
        // Check if we're inside a callout
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.name === this.name) {
            return editor.commands.lift(this.name);
          }
        }
        return false;
      },
    };
  },

  // Markdown serialization: default format (directives).
  // Flavor-aware serialization is provided by createVizelCalloutExtension() via .extend() closure.
  renderMarkdown(node, helpers) {
    const rawType = String((node as JSONContent).attrs?.type ?? "info");
    const type = isVizelCalloutType(rawType) ? rawType : "info";
    const content = helpers.renderChildren((node as JSONContent).content ?? [], "\n\n");
    return `:::${type}\n${content}\n:::\n\n`;
  },

  // Markdown tokenizer: recognize multiple callout formats
  markdownTokenizer: {
    name: "callout",
    level: "block" as const,

    start(src: string) {
      const directiveIdx = src.indexOf(":::");
      const alertIdx = src.indexOf("> [!");
      if (directiveIdx === -1 && alertIdx === -1) return -1;
      if (directiveIdx === -1) return alertIdx;
      if (alertIdx === -1) return directiveIdx;
      return Math.min(directiveIdx, alertIdx);
    },

    tokenize(
      src: string,
      _tokens: MarkdownToken[],
      lexer: MarkdownLexerConfiguration
    ): MarkdownToken | undefined {
      // Try directive format first: :::type\ncontent\n:::
      const directiveMatch = DIRECTIVE_REGEX.exec(src);
      if (directiveMatch) {
        const admonitionType = parseCalloutType(directiveMatch[1] ?? "info");
        const text = directiveMatch[2] ?? "";

        return {
          type: "callout",
          raw: directiveMatch[0],
          admonitionType,
          text,
          tokens: lexer.blockTokens(text),
        };
      }

      // Try alert/callout format: > [!TYPE]\n> content
      const alertMatch = ALERT_REGEX.exec(src);
      if (alertMatch) {
        const admonitionType = parseCalloutType(alertMatch[1] ?? "info");
        const rawContent = alertMatch[2] ?? "";
        const text = stripBlockquotePrefix(rawContent);

        return {
          type: "callout",
          raw: alertMatch[0],
          admonitionType,
          text,
          tokens: lexer.blockTokens(text),
        };
      }

      return undefined;
    },
  },

  // Markdown parser: convert tokens to Tiptap JSON
  parseMarkdown(token: MarkdownToken, helpers: MarkdownParseHelpers): MarkdownParseResult {
    return {
      type: "callout",
      attrs: { type: token.admonitionType || "info" },
      content: helpers.parseChildren(token.tokens || []),
    };
  },
});

/**
 * Create a configured Callout extension.
 *
 * @example
 * ```typescript
 * import { createVizelCalloutExtension } from '@vizel/core'
 *
 * const extensions = [
 *   createVizelCalloutExtension({ markdownFormat: "github-alerts" }),
 * ]
 * ```
 */
export function createVizelCalloutExtension(options: VizelCalloutOptions = {}) {
  const markdownFormat: VizelCalloutMarkdownFormat = options.markdownFormat ?? "directives";

  // Use .extend() to capture markdownFormat in a closure for renderMarkdown,
  // because `this.options` / `this.storage` are not accessible in the renderMarkdown context.
  return VizelCallout.extend({
    renderMarkdown(node, helpers) {
      const rawType = String((node as JSONContent).attrs?.type ?? "info");
      const type = isVizelCalloutType(rawType) ? rawType : "info";
      const content = helpers.renderChildren((node as JSONContent).content ?? [], "\n\n");

      switch (markdownFormat) {
        case "github-alerts": {
          const alertType = VIZEL_TO_GITHUB_ALERT[type] || "NOTE";
          const indented = addBlockquotePrefix(content);
          return `> [!${alertType}]\n${indented}\n\n`;
        }
        case "obsidian-callouts": {
          const indented = addBlockquotePrefix(content);
          return `> [!${type}]\n${indented}\n\n`;
        }
        case "blockquote-fallback": {
          const label = type.charAt(0).toUpperCase() + type.slice(1);
          const prefixed = addBlockquotePrefix(`**${label}**: ${content}`);
          return `${prefixed}\n\n`;
        }
        case "directives":
          return `:::${type}\n${content}\n:::\n\n`;
        default: {
          const _exhaustive: never = markdownFormat;
          return `:::${type}\n${content}\n:::\n\n`;
        }
      }
    },
  }).configure({
    HTMLAttributes: {
      ...options.HTMLAttributes,
    },
    markdownFormat,
  });
}
