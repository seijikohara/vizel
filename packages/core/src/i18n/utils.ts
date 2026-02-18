import { vizelEnLocale } from "./en.ts";
import type { VizelLocale, VizelLocalePartial } from "./types.ts";

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
