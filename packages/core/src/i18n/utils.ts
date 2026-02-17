import { vizelEnLocale } from "./en.ts";
import type { VizelLocale, VizelLocalePartial } from "./types.ts";

/**
 * Create a complete locale by merging partial translations with the default English locale.
 *
 * @example
 * ```typescript
 * const jaLocale = createVizelLocale({
 *   toolbar: { undo: "元に戻す", redo: "やり直し" },
 *   blockMenu: { delete: "削除", duplicate: "複製" },
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
      result[key] = { ...defaultSection, ...overrideSection };
    } else {
      result[key] = defaultSection;
    }
  }
  // All keys from vizelEnLocale are present in result
  return result as unknown as VizelLocale;
}

/**
 * Format a relative time string using locale templates.
 * Replaces `{n}` placeholder with the numeric value.
 */
export function formatRelativeTimeWithLocale(template: string, value: number): string {
  return template.replace("{n}", String(value));
}
