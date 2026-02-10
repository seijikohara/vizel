/**
 * Callout / Admonition Extension
 *
 * Provides callout blocks for informational content (info, warning, danger, tip, note).
 * Uses `:::type ... :::` Markdown syntax (compatible with remark-admonitions / GitHub Alerts).
 */

import type {
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownParseResult,
  MarkdownToken,
} from "@tiptap/core";
import { Node } from "@tiptap/core";

/**
 * Available callout types
 */
export type VizelCalloutType = "info" | "warning" | "danger" | "tip" | "note";

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
}

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
    };
  },

  addAttributes() {
    return {
      type: {
        default: "info" as VizelCalloutType,
        parseHTML: (element: HTMLElement) =>
          (element.getAttribute("data-type") as VizelCalloutType) || "info",
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

  // Markdown serialization: :::type\ncontent\n:::
  renderMarkdown(node, helpers) {
    const type = (node as JSONContent).attrs?.type || "info";
    const content = helpers.renderChildren((node as JSONContent).content ?? [], "\n\n");
    return `:::${type}\n${content}\n:::\n\n`;
  },

  // Markdown tokenizer: recognize :::type ... ::: blocks
  markdownTokenizer: {
    name: "callout",

    start(src: string) {
      return src.indexOf(":::");
    },

    tokenize(
      src: string,
      _tokens: MarkdownToken[],
      lexer: MarkdownLexerConfiguration
    ): MarkdownToken | undefined {
      const match = /^:::(\w+)\n([\s\S]*?)\n:::\n?/.exec(src);
      if (!match) return undefined;

      const admonitionType = match[1] ?? "info";
      const text = match[2] ?? "";

      return {
        type: "callout",
        raw: match[0],
        admonitionType,
        text,
        tokens: lexer.blockTokens(text),
      };
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
 *   createVizelCalloutExtension(),
 * ]
 * ```
 */
export function createVizelCalloutExtension(
  options: VizelCalloutOptions = {}
): ReturnType<typeof VizelCallout.configure> {
  return VizelCallout.configure({
    HTMLAttributes: {
      ...options.HTMLAttributes,
    },
  });
}
