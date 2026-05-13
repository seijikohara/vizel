import { vizelEnLocale } from "./en.ts";
import type { VizelLocale, VizelLocalePartial } from "./types.ts";

/**
 * Resolve FindReplace locale labels with English defaults.
 *
 * Returns a complete labels object even when the caller supplies a partial
 * locale or no locale at all. Framework components consume this helper to
 * avoid hand-writing `?? "Find..."` fallbacks inline.
 */
export function resolveVizelFindReplaceLabels(
  partial: VizelLocale["findReplace"] | undefined
): VizelLocale["findReplace"] {
  return {
    label: partial?.label ?? vizelEnLocale.findReplace.label,
    findPlaceholder: partial?.findPlaceholder ?? vizelEnLocale.findReplace.findPlaceholder,
    replacePlaceholder: partial?.replacePlaceholder ?? vizelEnLocale.findReplace.replacePlaceholder,
    noResults: partial?.noResults ?? vizelEnLocale.findReplace.noResults,
    findTextAriaLabel: partial?.findTextAriaLabel ?? vizelEnLocale.findReplace.findTextAriaLabel,
    replaceTextAriaLabel:
      partial?.replaceTextAriaLabel ?? vizelEnLocale.findReplace.replaceTextAriaLabel,
    findPreviousAriaLabel:
      partial?.findPreviousAriaLabel ?? vizelEnLocale.findReplace.findPreviousAriaLabel,
    findPreviousTitle: partial?.findPreviousTitle ?? vizelEnLocale.findReplace.findPreviousTitle,
    findNextAriaLabel: partial?.findNextAriaLabel ?? vizelEnLocale.findReplace.findNextAriaLabel,
    findNextTitle: partial?.findNextTitle ?? vizelEnLocale.findReplace.findNextTitle,
    replaceAriaLabel: partial?.replaceAriaLabel ?? vizelEnLocale.findReplace.replaceAriaLabel,
    replaceTitle: partial?.replaceTitle ?? vizelEnLocale.findReplace.replaceTitle,
    replaceAllAriaLabel:
      partial?.replaceAllAriaLabel ?? vizelEnLocale.findReplace.replaceAllAriaLabel,
    replaceAllTitle: partial?.replaceAllTitle ?? vizelEnLocale.findReplace.replaceAllTitle,
    caseSensitive: partial?.caseSensitive ?? vizelEnLocale.findReplace.caseSensitive,
    closeAriaLabel: partial?.closeAriaLabel ?? vizelEnLocale.findReplace.closeAriaLabel,
    closeTitle: partial?.closeTitle ?? vizelEnLocale.findReplace.closeTitle,
  };
}

/**
 * Create a complete locale by deep-merging partial translations with the default English locale.
 * Supports overriding individual strings at any nesting depth.
 *
 * @example
 * ```typescript
 * const jaLocale = createVizelLocale({
 *   toolbar: { undo: "元に戻す", redo: "やり直し" },
 *   slashMenu: { groups: { text: "テキスト" } }, // override only one group name
 * });
 * ```
 */
export function createVizelLocale(partial: VizelLocalePartial): VizelLocale {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(vizelEnLocale) as (keyof VizelLocale)[]) {
    const defaultSection = vizelEnLocale[key];
    const overrideSection = partial[key];
    if (
      overrideSection &&
      typeof defaultSection === "object" &&
      typeof overrideSection === "object"
    ) {
      result[key] = deepMergeSection(
        defaultSection as Record<string, unknown>,
        overrideSection as Record<string, unknown>
      );
    } else {
      result[key] = defaultSection;
    }
  }
  // Safe cast: all keys from vizelEnLocale are iterated and assigned,
  // so result has the complete VizelLocale shape at runtime.
  return result as unknown as VizelLocale;
}

/** Deep merge a locale section (supports nested objects like slashMenu.groups). */
function deepMergeSection(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMergeSection(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result;
}

/**
 * Format a relative time string using locale templates.
 * Replaces `{n}` placeholder with the numeric value.
 */
export function formatRelativeTimeWithLocale(template: string, value: number): string {
  return template.replace("{n}", String(value));
}
