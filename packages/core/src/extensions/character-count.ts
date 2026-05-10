import type { Extension } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";

export interface VizelCharacterCountOptions {
  /**
   * The maximum number of characters allowed. Omit (or pass `0`) to leave the
   * count unlimited.
   * @default undefined
   */
  limit?: number;
  /**
   * The counting mode.
   * - 'textSize': Count characters in the text content only
   * - 'nodeSize': Count all nodes including formatting
   * @default 'textSize'
   */
  mode?: "textSize" | "nodeSize";
  /**
   * Custom function to count words.
   * By default, words are counted by splitting on whitespace.
   */
  wordCounter?: (text: string) => number;
}

/**
 * Character count storage interface for accessing count values.
 */
export interface VizelCharacterCountStorage {
  /**
   * Get the character count.
   * @param options - Optional mode override
   */
  characters: (options?: { mode?: "textSize" | "nodeSize" }) => number;
  /**
   * Get the word count.
   */
  words: () => number;
}

/**
 * Creates the character count extension for tracking content statistics.
 *
 * @example
 * ```typescript
 * import { createVizelCharacterCountExtension } from '@vizel/core'
 *
 * const extension = createVizelCharacterCountExtension({
 *   limit: 1000,
 *   mode: 'textSize'
 * })
 *
 * // Access counts via editor storage
 * const chars = editor.storage.characterCount.characters()
 * const words = editor.storage.characterCount.words()
 * ```
 */
export function createVizelCharacterCountExtension(
  options: VizelCharacterCountOptions = {}
): Extension {
  const { limit, mode = "textSize", wordCounter } = options;

  return CharacterCount.configure({
    limit: limit ?? null,
    mode,
    ...(wordCounter !== undefined && { wordCounter }),
  });
}

/**
 * Raw `@tiptap/extension-character-count` extension, re-exported for
 * advanced usage. Prefer {@link createVizelCharacterCountExtension} unless
 * you need direct access to the underlying Tiptap extension.
 */
export { CharacterCount };
