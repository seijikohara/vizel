import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import {
  testPluginConfigErrorIsTyped,
  testUploadFailureReachesOnError,
} from "../../scenarios/error-model-bc.scenario";
import UploadErrorFixture from "./UploadErrorFixture.vue";

describe("UploadError (Vitest Browser) - Vue", () => {
  test("upload failure reaches editor-level onError with UPLOAD_FAILED", async () => {
    render(UploadErrorFixture);
    await testUploadFailureReachesOnError(page.elementLocator(document.body));
  });

  test("plugin-system raises a typed INVALID_CONFIG error", async () => {
    render(UploadErrorFixture);
    await testPluginConfigErrorIsTyped(page.elementLocator(document.body));
  });
});
