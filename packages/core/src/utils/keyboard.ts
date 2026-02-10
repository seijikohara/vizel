/**
 * Keyboard shortcut formatting utilities.
 *
 * Provides platform-aware formatting for keyboard shortcuts,
 * converting generic modifier names (Mod, Shift, Alt) to
 * platform-appropriate symbols.
 */

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
 * Format a keyboard shortcut string for the current platform.
 *
 * Converts generic modifier names to platform-appropriate symbols:
 * - macOS: Mod→⌘, Shift→⇧, Alt→⌥, keys joined without separator
 * - Other: Mod→Ctrl, Shift→Shift, Alt→Alt, keys joined with +
 *
 * @example
 * ```ts
 * // On macOS:
 * formatVizelShortcut("Mod+B")        // "⌘B"
 * formatVizelShortcut("Mod+Shift+Z")  // "⇧⌘Z"
 * formatVizelShortcut("Mod+Alt+1")    // "⌥⌘1"
 *
 * // On Windows/Linux:
 * formatVizelShortcut("Mod+B")        // "Ctrl+B"
 * formatVizelShortcut("Mod+Shift+Z")  // "Ctrl+Shift+Z"
 * formatVizelShortcut("Mod+Alt+1")    // "Ctrl+Alt+1"
 * ```
 */
export function formatVizelShortcut(shortcut: string): string {
  const isMac = isVizelMacPlatform();
  const parts = shortcut.split("+");

  if (isMac) {
    // macOS: use symbols, modifiers first in standard Apple order (⌃⌥⇧⌘)
    const modifiers: string[] = [];
    let key = "";

    for (const part of parts) {
      switch (part) {
        case "Mod":
          modifiers.push("⌘");
          break;
        case "Shift":
          modifiers.push("⇧");
          break;
        case "Alt":
          modifiers.push("⌥");
          break;
        case "Ctrl":
          modifiers.push("⌃");
          break;
        default:
          key = part;
      }
    }

    // Apple standard modifier order: ⌃ ⌥ ⇧ ⌘
    const order = ["⌃", "⌥", "⇧", "⌘"];
    modifiers.sort((a, b) => order.indexOf(a) - order.indexOf(b));

    return modifiers.join("") + key;
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
export function formatVizelTooltip(label: string, shortcut?: string): string {
  if (!shortcut) return label;
  return `${label} (${formatVizelShortcut(shortcut)})`;
}
