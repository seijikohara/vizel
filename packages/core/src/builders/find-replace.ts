import type { VizelFindReplaceState } from "../extensions/find-replace.ts";
import type { VizelLocale } from "../i18n/types.ts";

/**
 * Derived display state for the `VizelFindReplace` panel. Each
 * framework component recomputes this whenever the plugin state
 * changes, then drives rendering off the boolean / string fields
 * instead of duplicating the `matchCount > 0 ? "${i}/${n}" :
 * noResults` ternary in three places.
 */
export interface VizelFindReplaceViewState {
  /** Whether the panel is open (mirrors `state.isOpen`). */
  isOpen: boolean;
  /** Whether the replace input row should be rendered. */
  isReplaceMode: boolean;
  /** Total number of matches. */
  matchCount: number;
  /** 1-based index of the active match (0 when no active match). */
  currentMatch: number;
  /** Display string for the match counter (e.g. `"1/5"` or `"No matches"`). */
  matchCountDisplay: string;
  /** Whether navigation/replace buttons should be disabled. */
  isDisabled: boolean;
}

/**
 * Compute the find-replace panel display state.
 *
 * Accepts the live plugin state (or `null` while the editor hasn't
 * registered the plugin yet) plus the resolved `noResults` label —
 * the latter is the only piece of locale data the counter cares
 * about, so the helper takes a string rather than a full locale to
 * keep the unit testable.
 */
export function buildVizelFindReplaceViewState(
  state: VizelFindReplaceState | null,
  noResultsLabel: string
): VizelFindReplaceViewState {
  const isOpen = state?.isOpen ?? false;
  const isReplaceMode = state?.mode === "replace";
  const matchCount = state?.matches.length ?? 0;
  const activeIndex = state?.activeIndex ?? -1;
  const currentMatch = activeIndex >= 0 ? activeIndex + 1 : 0;
  const matchCountDisplay = matchCount > 0 ? `${currentMatch}/${matchCount}` : noResultsLabel;

  return {
    isOpen,
    isReplaceMode,
    matchCount,
    currentMatch,
    matchCountDisplay,
    isDisabled: matchCount === 0,
  };
}

/**
 * Convenience overload that resolves the `noResults` label from a
 * full locale. Equivalent to calling
 * `buildVizelFindReplaceViewState(state, locale?.findReplace?.noResults
 * ?? "No matches")`.
 */
export function buildVizelFindReplaceViewStateFromLocale(
  state: VizelFindReplaceState | null,
  locale: VizelLocale | undefined
): VizelFindReplaceViewState {
  return buildVizelFindReplaceViewState(state, locale?.findReplace?.noResults ?? "No matches");
}
