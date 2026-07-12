import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Vitest Browser Mode port of the unified Vizel error-model scenarios.
 *
 * These scenarios prove that an image-upload rejection reaches the
 * editor-level `onError` sink as a `VizelError` carrying the `UPLOAD_FAILED`
 * code, not only the feature-level `onUploadError` callback. The fixture wires
 * `features.content.image.onUpload` to reject and records `error.code` into the
 * element `[data-error-code]`. Each scenario triggers an upload by dispatching
 * the `vizel:upload-image` custom event with a valid image `File`, which passes
 * validation and reaches the rejecting handler.
 */

const ERROR_CODE_SELECTOR = "[data-error-code]";
const PLUGIN_ERROR_CODE_SELECTOR = "[data-plugin-error-code]";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears. A generous
// budget covers the contended multi-instance browser matrix.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

/**
 * Dispatch the `vizel:upload-image` custom event the slash-command upload path
 * uses. The file type passes the default validation allow-list, so the upload
 * reaches the consumer's `onUpload` handler.
 *
 * The registered handler resolves the live editor through its own `getEditor`
 * getter; the event detail only needs a `file` and an `editor` key so the
 * handler's type guard accepts the event.
 */
async function dispatchUploadImageEvent(): Promise<void> {
  const editor = await resolveEditor();
  await userEvent.click(page.elementLocator(editor));

  const file = new File(["x"], "broken.png", { type: "image/png" });
  const event = new CustomEvent("vizel:upload-image", {
    detail: { file, editor: {} },
  });
  document.dispatchEvent(event);
}

/**
 * Verify an image-upload rejection reaches the editor-level `onError` sink with
 * the `UPLOAD_FAILED` code.
 */
export const testUploadFailureReachesOnError: VizelBcScenario = async () => {
  await dispatchUploadImageEvent();

  const errorCode = document.querySelector(ERROR_CODE_SELECTOR);
  if (errorCode === null) throw new Error("expected a [data-error-code] element");
  // Anchor the match: `toHaveTextContent` is a substring check by default, but
  // the Playwright original asserted exact equality of the error code.
  await expect.element(page.elementLocator(errorCode)).toHaveTextContent(/^UPLOAD_FAILED$/);
};

/**
 * Verify the plugin-system raises a typed `VizelError("INVALID_CONFIG", ...)`
 * for a malformed plugin. The fixture runs `validateVizelPlugin` on mount and
 * records the resulting `error.code` into `[data-plugin-error-code]`, so the
 * conversion from a raw `throw new Error` exercises through the live bundle.
 */
export const testPluginConfigErrorIsTyped: VizelBcScenario = async () => {
  const pluginErrorCode = document.querySelector(PLUGIN_ERROR_CODE_SELECTOR);
  if (pluginErrorCode === null) throw new Error("expected a [data-plugin-error-code] element");
  await expect.element(page.elementLocator(pluginErrorCode)).toHaveTextContent(/^INVALID_CONFIG$/);
};
