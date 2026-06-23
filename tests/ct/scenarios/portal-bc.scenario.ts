import { expect } from "vitest";
import { page, type VizelBcScenario } from "./_vitest-context";

// Resolve the portal root element. The React VizelPortal defers mount to
// a useEffect, so the #vizel-portal-root element appears asynchronously
// after the fixture renders. Poll rather than querying once.
async function resolvePortalRoot(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector("#vizel-portal-root"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>("#vizel-portal-root");
  if (el === null) throw new Error("expected #vizel-portal-root in document.body");
  return el;
}

/**
 * Verify the portal container is created in document.body.
 *
 * VizelPortal defers DOM creation to a useEffect so the container never
 * appears during SSR. Poll until the element is present rather than
 * asserting immediately after render.
 */
export const testPortalContainerCreated: VizelBcScenario = async () => {
  const el = await resolvePortalRoot();
  await expect.element(page.elementLocator(el)).toBeInTheDocument();
};

/**
 * Verify portal content is rendered inside the portal container.
 *
 * The wrapper div carrying `data-vizel-portal-layer` and the test content
 * div both render inside #vizel-portal-root, not inside the component tree.
 */
export const testPortalContentRendered: VizelBcScenario = async () => {
  const root = await resolvePortalRoot();
  // Wait for the portal layer wrapper to appear inside the root.
  await expect
    .poll(() => root.querySelector<HTMLElement>("[data-vizel-portal-layer]"), { timeout: 5_000 })
    .not.toBeNull();
  // The test content must be visible inside the portal root.
  const content = root.querySelector<HTMLElement>(".test-portal-content");
  if (content === null) throw new Error("expected .test-portal-content inside #vizel-portal-root");
  await expect.element(page.elementLocator(content)).toBeVisible();
};

/**
 * Verify the portal wrapper carries the correct z-index for the given layer.
 *
 * VizelPortal writes the z-index as an inline style on the wrapper div, so
 * getComputedStyle returns the value without loading any stylesheet.
 */
export const testPortalZIndexLayer = async (
  layer: "dropdown" | "modal" | "tooltip"
): Promise<void> => {
  const root = await resolvePortalRoot();
  await expect
    .poll(() => root.querySelector<HTMLElement>(`[data-vizel-portal-layer="${layer}"]`), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const wrapper = root.querySelector<HTMLElement>(`[data-vizel-portal-layer="${layer}"]`);
  if (wrapper === null) {
    throw new Error(`expected [data-vizel-portal-layer="${layer}"] inside #vizel-portal-root`);
  }
  const expectedZIndex = { dropdown: "50", modal: "100", tooltip: "150" } as const;
  expect(getComputedStyle(wrapper).zIndex).toBe(expectedZIndex[layer]);
};

/**
 * Verify a disabled portal renders content in place rather than teleporting to body.
 *
 * When `disabled` is true, VizelPortal returns its children directly, so the
 * content stays inside the fixture container and #vizel-portal-root holds no
 * portal layer.
 */
export const testPortalDisabled: VizelBcScenario = async () => {
  // The portal root must not contain a layer wrapper when disabled.
  // Allow a brief poll because the portal root itself may still be created
  // from a previous test — check for the *layer wrapper* specifically.
  await expect
    .poll(() => document.querySelector("#vizel-portal-root [data-vizel-portal-layer]"), {
      timeout: 2_000,
    })
    .toBeNull();

  // Content must appear inside the fixture container, not in the portal root.
  const fixture = document.querySelector<HTMLElement>("[data-testid='portal-fixture']");
  if (fixture === null) throw new Error("expected [data-testid='portal-fixture'] in the document");
  const content = fixture.querySelector<HTMLElement>(".test-portal-content");
  if (content === null) {
    throw new Error("expected .test-portal-content inside [data-testid='portal-fixture']");
  }
  await expect.element(page.elementLocator(content)).toBeVisible();
};

/**
 * Verify portal content escapes an overflow:hidden container.
 *
 * The fixture wraps the portal in a 100×50 px element with overflow:hidden.
 * Because VizelPortal teleports to #vizel-portal-root at body level, the
 * content remains visible regardless of the ancestor's overflow restriction.
 */
export const testPortalEscapesOverflow: VizelBcScenario = async () => {
  const root = await resolvePortalRoot();
  // Content must be visible inside the portal root, outside the overflow container.
  await expect
    .poll(() => root.querySelector<HTMLElement>(".test-portal-content"), { timeout: 5_000 })
    .not.toBeNull();
  const content = root.querySelector<HTMLElement>(".test-portal-content");
  if (content === null) throw new Error("expected .test-portal-content inside #vizel-portal-root");
  await expect.element(page.elementLocator(content)).toBeVisible();
  // Confirm the layer wrapper is present (portal successfully escaped).
  const wrapper = root.querySelector<HTMLElement>("[data-vizel-portal-layer]");
  if (wrapper === null)
    throw new Error("expected [data-vizel-portal-layer] inside #vizel-portal-root");
};

/**
 * Verify a custom className is applied to the portal wrapper div.
 *
 * VizelPortal forwards `className` to the wrapper element it creates inside
 * #vizel-portal-root. The class must appear on that wrapper, not on the
 * #vizel-portal-root container itself.
 */
export const testPortalCustomClass: VizelBcScenario = async () => {
  const root = await resolvePortalRoot();
  await expect
    .poll(() => root.querySelector<HTMLElement>(".custom-portal-class"), { timeout: 5_000 })
    .not.toBeNull();
  const wrapper = root.querySelector<HTMLElement>(".custom-portal-class");
  if (wrapper === null) throw new Error("expected .custom-portal-class inside #vizel-portal-root");
  await expect.element(page.elementLocator(wrapper)).toBeInTheDocument();
};
