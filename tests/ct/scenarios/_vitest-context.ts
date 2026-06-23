// Single neutral entry point for the Vitest Browser context so scenarios stay
// framework-agnostic. Each framework's spec renders its fixture, then calls a
// scenario. Scenarios locate component-scoped nodes via document queries wrapped
// in `page.elementLocator` and use `page` for portals (menus rendered to body).
import type { Locator } from "vitest/browser";
import { userEvent } from "vitest/browser";

export { page, userEvent } from "vitest/browser";

// `root` is the rendered fixture's container element wrapped as a Locator.
export type VizelBcScenario = (root: Locator) => Promise<void>;

// Tiptap binds shortcuts to "Mod", which ProseMirror maps to Meta on Apple
// platforms and Control elsewhere. Mirror ProseMirror's own platform detection
// so keyboard scenarios apply the modifier the editor listens for, on both local
// macOS and Linux CI.
const isApplePlatform =
  typeof navigator !== "undefined" && /Mac|iP(hone|[oa]d)/.test(navigator.platform);

/** Platform modifier ProseMirror binds to "Mod" (Meta on Apple, Control elsewhere). */
export const MOD_KEY = isApplePlatform ? "Meta" : "Control";

/**
 * Press a keyboard chord in @testing-library/user-event syntax. Every argument
 * except the last is held as a modifier around the final key, so
 * `pressKeyChord("Mod", "Alt", "1")` presses Mod+Alt+1. "Mod" expands to the
 * platform modifier ProseMirror binds shortcuts to.
 */
export async function pressKeyChord(...keys: readonly string[]): Promise<void> {
  const resolved = keys.map((key) => (key === "Mod" ? MOD_KEY : key));
  const finalKey = resolved.at(-1);
  if (finalKey === undefined) throw new Error("pressKeyChord requires at least one key");
  const modifiers = resolved.slice(0, -1);
  const held = modifiers.map((modifier) => `{${modifier}>}`).join("");
  const released = modifiers
    .map((modifier) => `{/${modifier}}`)
    .reverse()
    .join("");
  await userEvent.keyboard(`${held}{${finalKey}}${released}`);
}
