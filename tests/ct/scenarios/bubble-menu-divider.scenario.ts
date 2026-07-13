import { expect } from "vitest";

import type { VizelBcScenario } from "./_vitest-context";

// Resolve the divider element. `VizelBubbleMenuDivider` renders synchronously,
// but poll with a small budget to absorb any framework hydration delay.
async function resolveDivider(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-bubble-menu-divider"), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-bubble-menu-divider");
  if (el === null) throw new Error("expected a .vizel-bubble-menu-divider element");
  return el;
}

/**
 * Verify the divider renders exactly once and carries its base CSS class.
 *
 * `VizelBubbleMenuDivider` is a zero-content decorative `<span>`, so assertions
 * check DOM presence and class membership rather than visual visibility, which
 * requires non-zero dimensions.
 */
export const testDividerRendersWithBaseClass: VizelBcScenario = async () => {
  await expect
    .poll(() => document.querySelectorAll(".vizel-bubble-menu-divider").length, { timeout: 5_000 })
    .toBe(1);
  const el = await resolveDivider();
  expect(el.classList.contains("vizel-bubble-menu-divider")).toBe(true);
};

/**
 * Verify the divider merges a consumer-supplied class alongside the base class.
 *
 * The Playwright original uses `toHaveClass(/custom-divider/)`, which checks
 * class membership without requiring visibility.
 */
export const testDividerAcceptsCustomClass: VizelBcScenario = async () => {
  const el = await resolveDivider();
  // Both the base class and the consumer class must coexist on the same element.
  expect(el.classList.contains("vizel-bubble-menu-divider")).toBe(true);
  expect(el.classList.contains("custom-divider")).toBe(true);
};

/**
 * Verify the divider renders as a `<span>` element.
 *
 * The Playwright original queries `span.vizel-bubble-menu-divider` and asserts
 * count=1, so the tag name is the structural invariant under test.
 */
export const testDividerIsSpanElement: VizelBcScenario = async () => {
  const el = await resolveDivider();
  expect(el.tagName.toLowerCase()).toBe("span");
};
