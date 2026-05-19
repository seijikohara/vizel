/**
 * Mention Extension
 *
 * Provides @mention autocomplete functionality using @tiptap/extension-mention.
 * This is an opt-in feature (disabled by default) that requires user-provided
 * items for suggestion filtering.
 */

import type { Editor } from "@tiptap/core";
import Mention from "@tiptap/extension-mention";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { SuggestionOptions } from "@tiptap/suggestion";
import type MarkdownIt from "markdown-it";
import type { MarkdownSerializerState } from "prosemirror-markdown";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mention: {
      /** Insert a mention node */
      insertMention: (attributes: { id: string; label: string }) => ReturnType;
    };
  }
}

/**
 * A single mention item for the suggestion list.
 */
export interface VizelMentionItem {
  /** Unique identifier for the mentioned entity */
  id: string;
  /** Display label (e.g. user name) */
  label: string;
  /** Optional avatar URL */
  avatar?: string;
  /** Optional description (e.g. email or role) */
  description?: string;
}

/**
 * Options for the mention extension.
 */
export interface VizelMentionOptions {
  /**
   * Function to fetch mention suggestions based on query text.
   * Called every time the user types after the trigger character.
   *
   * @example
   * ```ts
   * items: async (query) => {
   *   const res = await fetch(`/api/users?q=${query}`);
   *   return res.json();
   * }
   * ```
   */
  items?: (query: string, editor: Editor) => VizelMentionItem[] | Promise<VizelMentionItem[]>;

  /**
   * Trigger character that activates mention suggestions.
   * @default "@"
   */
  trigger?: string;

  /**
   * Framework-specific suggestion renderer configuration.
   * Set by framework packages (react, vue, svelte) via createVizelMentionMenuRenderer().
   */
  suggestion?: Partial<SuggestionOptions<VizelMentionItem>>;

  /**
   * Whether to delete the trigger character when removing a mention with backspace.
   * @default false
   */
  deleteTriggerWithBackspace?: boolean;

  /**
   * Custom HTML attributes for the rendered mention element.
   */
  HTMLAttributes?: Record<string, string>;
}

/**
 * Register a markdown-it inline rule that recognizes `@username`
 * tokens and emits HTML matching the Tiptap mention node.
 *
 * The rule only fires at word boundaries to avoid matching email
 * addresses or other inline `@` usages.
 */
function registerMentionRule(md: MarkdownIt): void {
  md.inline.ruler.before("emphasis", "vizel_mention", (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x40) return false;
    if (state.pos > 0) {
      const prev = state.src[state.pos - 1];
      if (prev && /\w/.test(prev)) return false;
    }
    const rest = state.src.slice(state.pos + 1);
    const match = /^([\w-]+)/.exec(rest);
    if (!match) return false;
    const label = match[1] ?? "";
    if (!label) return false;
    if (!silent) {
      const token = state.push("vizel_mention", "span", 0);
      token.content = label;
    }
    state.pos += 1 + label.length;
    return true;
  });

  md.renderer.rules.vizel_mention = (tokens, idx) => {
    const label = tokens[idx]?.content ?? "";
    const escaped = label.replace(/"/g, "&quot;");
    return `<span data-type="mention" data-id="${escaped}" data-label="${escaped}" class="vizel-mention">@${escaped}</span>`;
  };
}

/**
 * Create the Vizel mention extension.
 *
 * @param options - Mention configuration options
 * @returns Configured Tiptap Mention extension
 *
 * @example
 * ```ts
 * const mention = createVizelMentionExtension({
 *   items: async (query) => {
 *     return users.filter(u => u.label.toLowerCase().includes(query.toLowerCase()));
 *   },
 * });
 * ```
 */
export function createVizelMentionExtension(options: VizelMentionOptions = {}) {
  const {
    items: itemsFn,
    trigger = "@",
    suggestion = {},
    deleteTriggerWithBackspace = false,
    HTMLAttributes = {},
  } = options;

  const VizelMention = Mention.extend({
    addStorage() {
      return {
        markdown: {
          serialize(state: MarkdownSerializerState, node: PMNode) {
            const label = String(node.attrs?.label ?? node.attrs?.id ?? "");
            state.write(`@${label}`);
          },
          parse: {
            setup(md: MarkdownIt) {
              registerMentionRule(md);
            },
          },
        },
      };
    },
  });

  return VizelMention.configure({
    HTMLAttributes: {
      class: "vizel-mention",
      ...HTMLAttributes,
    },
    deleteTriggerWithBackspace,
    suggestion: {
      char: trigger,
      items: async ({ query, editor }: { query: string; editor: Editor }) => {
        if (!itemsFn) return [];
        return await itemsFn(query, editor);
      },
      ...suggestion,
    },
  });
}
