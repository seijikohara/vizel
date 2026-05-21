/**
 * Text highlighting utilities for Vizel editor.
 *
 * These utilities help with highlighting matched text segments,
 * typically used in fuzzy search results (e.g., slash menu).
 */

/**
 * A segment of text that may or may not be highlighted.
 */
export interface VizelTextSegment {
  /** The text content of this segment */
  text: string;
  /** Whether this segment should be highlighted */
  highlight: boolean;
}

/**
 * Split text into segments based on match indices from fuzzy search.
 *
 * @param text - The original text to split
 * @param matches - Array of [start, end] index pairs indicating matched regions
 * @returns Array of text segments with highlight flags
 *
 * @example
 * ```ts
 * // "Hello World" with "llo Wo" matched (indices [2,7])
 * const segments = splitVizelTextByMatches("Hello World", [[2, 7]]);
 * // Returns:
 * // [
 * //   { text: "He", highlight: false },
 * //   { text: "llo Wo", highlight: true },
 * //   { text: "rld", highlight: false },
 * // ]
 * ```
 */
export function splitVizelTextByMatches(
  text: string,
  matches?: [number, number][]
): VizelTextSegment[] {
  if (!matches || matches.length === 0) {
    return [{ text, highlight: false }];
  }

  const result = matches.reduce<{
    segments: VizelTextSegment[];
    cursor: number;
  }>(
    (acc, [start, end]) => {
      if (start > acc.cursor) {
        acc.segments.push({ text: text.slice(acc.cursor, start), highlight: false });
      }
      acc.segments.push({ text: text.slice(start, end + 1), highlight: true });
      acc.cursor = end + 1;
      return acc;
    },
    { segments: [], cursor: 0 }
  );

  if (result.cursor < text.length) {
    result.segments.push({ text: text.slice(result.cursor), highlight: false });
  }
  return result.segments;
}
