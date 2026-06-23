import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testPluginConfigErrorIsTyped,
  testUploadFailureReachesOnError,
} from "../../scenarios/error-model-bc.scenario";
import UploadErrorFixture from "./UploadErrorFixture.svelte";

describe("UploadError (Vitest Browser) - Svelte", () => {
  test("upload failure reaches editor-level onError with UPLOAD_FAILED", async () => {
    render(UploadErrorFixture);
    await testUploadFailureReachesOnError(page.elementLocator(document.body));
  });

  test("plugin-system raises a typed INVALID_CONFIG error", async () => {
    render(UploadErrorFixture);
    await testPluginConfigErrorIsTyped(page.elementLocator(document.body));
  });
});
