/**
 * Mention Extension
 *
 * Provides @mention autocomplete functionality using @tiptap/extension-mention.
 * This is an opt-in feature (disabled by default) that requires user-provided
 * items for suggestion filtering.
 */

import type {
  Editor,
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownParseResult,
  MarkdownToken,
} from "@tiptap/core";
import Mention from "@tiptap/extension-mention";
import type { SuggestionOptions } from "@tiptap/suggestion";

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
    // Markdown serialization: @label
    renderMarkdown(node) {
      const jsonNode = node as JSONContent;
      const label = jsonNode.attrs?.label ?? jsonNode.attrs?.id ?? "";
      return `@${label}`;
    },

    // Markdown tokenizer: recognize @mention inline syntax
    markdownTokenizer: {
      name: "mention",
      level: "inline" as const,

      start(src: string) {
        const idx = src.indexOf("@");
        if (idx <= 0) return idx;
        const prev = src[idx - 1];
        if (prev && /\w/.test(prev)) return -1;
        return idx;
      },

      tokenize(
        src: string,
        _tokens: MarkdownToken[],
        _lexer: MarkdownLexerConfiguration
      ): MarkdownToken | undefined {
        const match = /^@([\w-]+)/.exec(src);
        if (!match) return undefined;

        return {
          type: "mention",
          raw: match[0],
          mentionLabel: match[1] ?? "",
        };
      },
    },

    // Markdown parser: convert tokens to Tiptap JSON
    parseMarkdown(token: MarkdownToken, _helpers: MarkdownParseHelpers): MarkdownParseResult {
      const label = (token as MarkdownToken & { mentionLabel?: string }).mentionLabel ?? "";

      return {
        type: "mention",
        attrs: {
          id: label,
          label,
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
