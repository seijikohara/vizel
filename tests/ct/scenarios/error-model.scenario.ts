import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared scenarios for the unified Vizel error model.
 *
 * These scenarios are framework-agnostic and run against React, Vue, and
 * Svelte. They prove that an image-upload rejection reaches the editor-level
 * `onError` sink as a `VizelError` carrying the `UPLOAD_FAILED` code — not
 * only the feature-level `onUploadError` callback.
 *
 * The fixture wires `features.content.image.onUpload` to reject and records
 * `error.code` into the element `[data-error-code]`. The scenario triggers an
 * upload by dispatching the `vizel:upload-image` custom event with a valid
 * image `File`, which passes validation and reaches the rejecting handler.
 */

const ERROR_CODE_SELECTOR = "[data-error-code]";
const PLUGIN_ERROR_CODE_SELECTOR = "[data-plugin-error-code]";

/**
 * Dispatch the `vizel:upload-image` custom event the slash-command upload
 * path uses. The file type passes the default validation allow-list, so the
 * upload reaches the consumer's `onUpload` handler.
 */
async function dispatchUploadImageEvent(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await page.evaluate(() => {
    // The registered handler resolves the live editor through its own
    // `getEditor` getter; the event detail only needs a `file` and an
    // `editor` key so the handler's type guard accepts the event.
    const file = new File(["x"], "broken.png", { type: "image/png" });
    const event = new CustomEvent("vizel:upload-image", {
      detail: { file, editor: {} },
    });
    document.dispatchEvent(event);
  });
}

/**
 * Verify an image-upload rejection reaches the editor-level `onError` sink
 * with the `UPLOAD_FAILED` code.
 */
export async function testUploadFailureReachesOnError(
  component: Locator,
  page: Page
): Promise<void> {
  await dispatchUploadImageEvent(component, page);

  const errorCode = component.locator(ERROR_CODE_SELECTOR);
  await expect(errorCode).toHaveText("UPLOAD_FAILED");
}

/**
 * Verify the plugin-system raises a typed `VizelError("INVALID_CONFIG", ...)`
 * for a malformed plugin. The fixture runs `validateVizelPlugin` on mount and
 * records the resulting `error.code` into `[data-plugin-error-code]`, so the
 * conversion from a raw `throw new Error` exercises through the live bundle.
 */
export async function testPluginConfigErrorIsTyped(component: Locator, _page: Page): Promise<void> {
  const pluginErrorCode = component.locator(PLUGIN_ERROR_CODE_SELECTOR);
  await expect(pluginErrorCode).toHaveText("INVALID_CONFIG");
}
