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
 * Input parsing is always tolerant (all formats recognized) via a
 * markdown-it block rule registered in `addStorage().markdown.parse.setup`.
 * Output format is controlled by the `markdownFormat` option.
 */

import { Node } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type { MarkdownSerializerState } from "prosemirror-markdown";
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
      /** Wrap the current selection in a callout block. */
      setCallout: (attributes?: { type?: VizelCalloutType }) => ReturnType;
      /** Toggle a callout block around the current selection. */
      toggleCallout: (attributes?: { type?: VizelCalloutType }) => ReturnType;
      /** Lift content out of a callout block. */
      unsetCallout: () => ReturnType;
      /** Change the type of the current callout. */
      setCalloutType: (type: VizelCalloutType) => ReturnType;
    };
  }
}

/**
 * Options for the Callout extension.
 */
export interface VizelCalloutOptions {
  /** HTML attributes to add to the callout element. */
  HTMLAttributes?: Record<string, unknown>;
  /**
   * Markdown output format for callout serialization.
   *
   * When using `createVizelExtensions()`, this is set automatically based on the editor's
   * `flavor` setting (e.g. `"gfm"` -> `"github-alerts"`, `"obsidian"` -> `"obsidian-callouts"`).
   * When using `VizelCallout` directly, defaults to `"directives"`.
   */
  markdownFormat?: VizelCalloutMarkdownFormat;
}

// Map Vizel callout types to GitHub Alert types (UPPER_CASE).
const VIZEL_TO_GITHUB_ALERT: Record<VizelCalloutType, string> = {
  note: "NOTE",
  info: "NOTE",
  tip: "TIP",
  warning: "WARNING",
  danger: "CAUTION",
};

// Map GitHub Alert types back to Vizel callout types.
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

// ---- markdown-it block rule -----------------------------------------------

/**
 * Register a markdown-it block rule that recognizes every supported
 * callout syntax (directives, GitHub alerts, Obsidian callouts).
 *
 * The rule emits a `vizel_callout_open` / `vizel_callout_close` token
 * pair wrapping the inner block tokens. The renderer outputs HTML that
 * matches `VizelCallout.parseHTML`, so the Tiptap layer hydrates the
 * node directly from the rendered HTML.
 */
function readLine(state: StateBlock, lineIndex: number): string {
  const pos = (state.bMarks[lineIndex] ?? 0) + (state.tShift[lineIndex] ?? 0);
  const max = state.eMarks[lineIndex] ?? state.src.length;
  return state.src.slice(pos, max);
}

function tryParseDirectiveCallout(
  state: StateBlock,
  md: MarkdownIt,
  startLine: number,
  endLine: number,
  silent: boolean,
  firstLine: string
): boolean | null {
  const match = /^:::(\w+)\s*$/.exec(firstLine);
  if (!match) return null;
  const type = parseCalloutType(match[1] ?? "info");
  let nextLine = startLine + 1;
  let closingLine = -1;
  while (nextLine < endLine) {
    if (readLine(state, nextLine) === ":::") {
      closingLine = nextLine;
      break;
    }
    nextLine++;
  }
  if (closingLine === -1) return false;
  if (silent) return true;
  const innerSrc = state.getLines(startLine + 1, closingLine, state.tShift[startLine] ?? 0, false);
  emitCalloutTokens(state, md, type, innerSrc, startLine, closingLine);
  state.line = closingLine + 1;
  return true;
}

function tryParseAlertCallout(
  state: StateBlock,
  md: MarkdownIt,
  startLine: number,
  endLine: number,
  silent: boolean,
  firstLine: string
): boolean | null {
  const match = /^>\s*\[!(\w+)\]\s*$/.exec(firstLine);
  if (!match) return null;
  const type = parseCalloutType(match[1] ?? "info");
  let nextLine = startLine + 1;
  const contentLines: string[] = [];
  while (nextLine < endLine) {
    const lineText = readLine(state, nextLine);
    if (!/^>/.test(lineText)) break;
    contentLines.push(lineText.replace(/^>\s?/, ""));
    nextLine++;
  }
  if (silent) return true;
  const innerSrc = contentLines.join("\n");
  emitCalloutTokens(state, md, type, innerSrc, startLine, nextLine - 1);
  state.line = nextLine;
  return true;
}

function registerCalloutRule(md: MarkdownIt): void {
  md.block.ruler.before(
    "fence",
    "vizel_callout",
    (state, startLine, endLine, silent) => {
      const firstLine = readLine(state, startLine);
      const directiveResult = tryParseDirectiveCallout(
        state,
        md,
        startLine,
        endLine,
        silent,
        firstLine
      );
      if (directiveResult !== null) return directiveResult;
      const alertResult = tryParseAlertCallout(state, md, startLine, endLine, silent, firstLine);
      if (alertResult !== null) return alertResult;
      return false;
    },
    { alt: ["paragraph", "blockquote"] }
  );

  md.renderer.rules.vizel_callout_open = (tokens, idx) => {
    const type = tokens[idx]?.attrGet("data-type") ?? "info";
    return `<div data-callout="" data-type="${type}" class="vizel-callout vizel-callout--${type}">`;
  };
  md.renderer.rules.vizel_callout_close = () => `</div>`;
}

/**
 * Emit a markdown-it token sequence for a parsed callout block.
 *
 * Re-enters the block parser on the inner source so nested formatting
 * (paragraphs, lists, etc.) tokenizes correctly between the open and
 * close tokens.
 */
function emitCalloutTokens(
  state: StateBlock,
  md: MarkdownIt,
  type: VizelCalloutType,
  innerSrc: string,
  startLine: number,
  endLine: number
): void {
  const openToken = state.push("vizel_callout_open", "div", 1);
  openToken.attrSet("data-type", type);
  openToken.block = true;
  openToken.map = [startLine, endLine + 1];

  md.block.parse(innerSrc, md, state.env, state.tokens);

  const closeToken = state.push("vizel_callout_close", "div", -1);
  closeToken.block = true;
}

// ---- Serializer -----------------------------------------------------------

/**
 * Serialize the inner content of a callout to markdown and split it
 * into lines for prefixing.
 *
 * Uses a fresh `MarkdownSerializerState` to render children without
 * disturbing the parent state's bookkeeping. The structural shape
 * (`out`, `renderContent`) is part of the public class API.
 */
function renderInnerToLines(state: MarkdownSerializerState, node: PMNode): string[] {
  const InnerStateCtor = state.constructor as new (
    nodes: Record<string, unknown>,
    marks: Record<string, unknown>,
    options: Record<string, unknown>
  ) => MarkdownSerializerState;
  const child = new InnerStateCtor(
    (state as unknown as { nodes: Record<string, unknown> }).nodes,
    (state as unknown as { marks: Record<string, unknown> }).marks,
    state.options as unknown as Record<string, unknown>
  );
  child.renderContent(node);
  return (child as unknown as { out: string }).out.trimEnd().split("\n");
}

function serializeCalloutBlock(
  state: MarkdownSerializerState,
  node: PMNode,
  format: VizelCalloutMarkdownFormat
): void {
  const rawType = String(node.attrs?.type ?? "info");
  const type: VizelCalloutType = isVizelCalloutType(rawType) ? rawType : "info";
  const lines = renderInnerToLines(state, node);

  switch (format) {
    case "github-alerts": {
      const alertType = VIZEL_TO_GITHUB_ALERT[type] || "NOTE";
      state.write(`> [!${alertType}]\n`);
      for (const line of lines) {
        state.write(`> ${line}\n`);
      }
      break;
    }
    case "obsidian-callouts": {
      state.write(`> [!${type}]\n`);
      for (const line of lines) {
        state.write(`> ${line}\n`);
      }
      break;
    }
    case "blockquote-fallback": {
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      const body = lines.join("\n");
      state.write(`> **${label}**: ${body}\n`);
      break;
    }
    default: {
      state.write(`:::${type}\n`);
      for (const line of lines) {
        state.write(`${line}\n`);
      }
      state.write(`:::\n`);
    }
  }
  state.closeBlock(node);
}

// ---- Node definition ------------------------------------------------------

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

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: PMNode) {
          const ctx = this as unknown as { options: VizelCalloutOptions };
          const format: VizelCalloutMarkdownFormat = ctx.options.markdownFormat ?? "directives";
          serializeCalloutBlock(state, node, format);
        },
        parse: {
          setup(md: MarkdownIt) {
            registerCalloutRule(md);
          },
        },
      },
    };
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
      Backspace: ({ editor }) => {
        const { $from } = editor.state.selection;
        const isAtStart = $from.parentOffset === 0;
        if (!isAtStart) return false;
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.name === this.name) {
            return editor.commands.lift(this.name);
          }
        }
        return false;
      },
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
  return VizelCallout.configure({
    HTMLAttributes: { ...options.HTMLAttributes },
    markdownFormat,
  });
}
