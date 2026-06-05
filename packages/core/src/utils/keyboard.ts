/**
 * Keyboard shortcut formatting utilities.
 *
 * Provides platform-aware formatting for keyboard shortcuts,
 * converting generic modifier names (Mod, Shift, Alt) to
 * platform-appropriate symbols.
 */

/**
 * Platform-specific shortcut shape accepted by {@link formatVizelShortcut}.
 *
 * The shape mirrors `VizelShortcut` (`commands/types.ts`) and
 * `VizelShortcutSpec` (`builders/types.ts`); the `utils/` layer declares
 * the shape locally so it depends on no other layer.
 */
export interface VizelPlatformShortcut {
  /** Shortcut string for macOS (Tiptap keymap notation, e.g. `Mod-Alt-1`). */
  readonly mac: string;
  /** Shortcut string for non-macOS platforms (Windows / Linux). */
  readonly other: string;
}

/**
 * Detect if the current platform is macOS.
 * Returns false during SSR (no `navigator`).
 */
export function isVizelMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  // navigator.platform is deprecated but widely supported;
  // navigator.userAgentData is the replacement but not yet universal
  if ("userAgentData" in navigator) {
    return (
      (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform === "macOS"
    );
  }
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Type guard for the `VizelPlatformShortcut` object shape.
 */
const isVizelPlatformShortcut = (value: unknown): value is VizelPlatformShortcut =>
  typeof value === "object" && value !== null && "mac" in value && "other" in value;

/**
 * Format a keyboard shortcut for the current platform.
 *
 * Accepts either a plain shortcut string or a `VizelPlatformShortcut`
 * object. For the object form, the function selects the `mac` or `other`
 * string via {@link isVizelMacPlatform}. Both separators are recognized:
 * the `+` notation used by the legacy slash hints and the `-` notation used
 * by Tiptap keymaps (e.g. `Mod-Alt-1`).
 *
 * Converts generic modifier names to platform-appropriate symbols:
 * - macOS: Mod→⌘, Shift→⇧, Alt→⌥, keys joined without separator
 * - Other: Mod→Ctrl, Shift→Shift, Alt→Alt, keys joined with +
 *
 * @example
 * ```ts
 * // On macOS:
 * formatVizelShortcut("Mod+B")                       // "⌘B"
 * formatVizelShortcut("Mod-Alt-1")                   // "⌥⌘1"
 * formatVizelShortcut({ mac: "Mod-B", other: "Mod-B" }) // "⌘B"
 *
 * // On Windows/Linux:
 * formatVizelShortcut("Mod+B")                       // "Ctrl+B"
 * formatVizelShortcut("Mod-Alt-1")                   // "Ctrl+Alt+1"
 * formatVizelShortcut({ mac: "Mod-B", other: "Ctrl-H" }) // "Ctrl+H"
 * ```
 */
export function formatVizelShortcut(shortcut: string | VizelPlatformShortcut): string {
  const isMac = isVizelMacPlatform();
  const resolvePlatformString = (value: string | VizelPlatformShortcut): string => {
    if (!isVizelPlatformShortcut(value)) return value;
    return isMac ? value.mac : value.other;
  };
  const raw = resolvePlatformString(shortcut);
  // Tiptap keymaps separate tokens with `-`; legacy hints use `+`. Split on
  // either so both notations resolve to the same modifier / key tokens.
  const parts = raw.split(/[+-]/);

  if (isMac) {
    // macOS: use symbols, modifiers first in standard Apple order (⌃⌥⇧⌘)
    const modifierSymbols: Record<string, string> = {
      Mod: "⌘",
      Shift: "⇧",
      Alt: "⌥",
      Ctrl: "⌃",
    };
    const modifierSet = new Set(Object.keys(modifierSymbols));
    const modifiers = parts
      .filter((part) => modifierSet.has(part))
      .map((part) => modifierSymbols[part] ?? part);
    const key = parts.findLast((part) => !modifierSet.has(part)) ?? "";

    // Apple standard modifier order: ⌃ ⌥ ⇧ ⌘
    const order = ["⌃", "⌥", "⇧", "⌘"];
    const orderedModifiers = [...modifiers].sort((a, b) => order.indexOf(a) - order.indexOf(b));

    return orderedModifiers.join("") + key;
  }

  // Windows/Linux: use text labels with + separator
  return parts
    .map((part) => {
      if (part === "Mod") return "Ctrl";
      return part;
    })
    .join("+");
}

/**
 * Format a tooltip string with an optional keyboard shortcut.
 *
 * @example
 * ```ts
 * formatVizelTooltip("Bold", "Mod+B")  // "Bold (⌘B)" on Mac, "Bold (Ctrl+B)" on other
 * formatVizelTooltip("Quote")           // "Quote"
 * ```
 */
export function formatVizelTooltip(
  label: string,
  shortcut?: string | VizelPlatformShortcut
): string {
  if (!shortcut) return label;
  return `${label} (${formatVizelShortcut(shortcut)})`;
}
