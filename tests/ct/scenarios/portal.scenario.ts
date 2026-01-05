import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Test that portal container is created in document.body
 */
export async function testPortalContainerCreated(component: Locator, page: Page): Promise<void> {
  // Wait for fixture to be attached (component may be empty due to portal)
  await expect(component).toBeAttached();

  // Check that portal container exists in body
  const portalContainer = page.locator("#vizel-portal-root");
  await expect(portalContainer).toBeAttached();
}

/**
 * Test that portal content is rendered in portal container
 */
export async function testPortalContentRendered(component: Locator, page: Page): Promise<void> {
  await expect(component).toBeAttached();

  // Content should be inside the portal container
  const portalContent = page.locator("#vizel-portal-root [data-vizel-portal-layer]");
  await expect(portalContent).toBeAttached();

  // Check that test content is visible
  const testContent = page.locator("#vizel-portal-root .test-portal-content");
  await expect(testContent).toBeVisible();
}

/**
 * Test that portal has correct z-index layer
 */
export async function testPortalZIndexLayer(
  component: Locator,
  page: Page,
  layer: "dropdown" | "modal" | "tooltip"
): Promise<void> {
  await expect(component).toBeAttached();

  // Check layer attribute
  const portalWrapper = page.locator(`#vizel-portal-root [data-vizel-portal-layer="${layer}"]`);
  await expect(portalWrapper).toBeAttached();

  // Check z-index
  const expectedZIndex = { dropdown: "50", modal: "100", tooltip: "150" };
  await expect(portalWrapper).toHaveCSS("z-index", expectedZIndex[layer]);
}

/**
 * Test that disabled portal renders content in place
 */
export async function testPortalDisabled(component: Locator, page: Page): Promise<void> {
  await expect(component).toBeAttached();

  // Content should NOT be in portal container
  const portalContent = page.locator("#vizel-portal-root [data-vizel-portal-layer]");
  await expect(portalContent).not.toBeAttached();

  // Content should be rendered in place (inside component)
  const inPlaceContent = component.locator(".test-portal-content");
  await expect(inPlaceContent).toBeVisible();
}

/**
 * Test that portal content escapes overflow:hidden container
 */
export async function testPortalEscapesOverflow(component: Locator, page: Page): Promise<void> {
  await expect(component).toBeAttached();

  // The portal content should be visible even with overflow hidden
  const portalContent = page.locator("#vizel-portal-root .test-portal-content");
  await expect(portalContent).toBeVisible();

  // Verify it's positioned at body level, not inside the overflow container
  const portalWrapper = page.locator("#vizel-portal-root [data-vizel-portal-layer]");
  await expect(portalWrapper).toBeAttached();
}

/**
 * Test that custom className is applied to portal wrapper
 */
export async function testPortalCustomClass(component: Locator, page: Page): Promise<void> {
  await expect(component).toBeAttached();

  // Check that custom class is applied
  const portalWrapper = page.locator("#vizel-portal-root .custom-portal-class");
  await expect(portalWrapper).toBeAttached();
}
