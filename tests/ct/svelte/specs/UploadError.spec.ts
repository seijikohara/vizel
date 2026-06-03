import { test } from "@playwright/experimental-ct-svelte";
import {
  testPluginConfigErrorIsTyped,
  testUploadFailureReachesOnError,
} from "../../scenarios/error-model.scenario";
import UploadErrorFixture from "./UploadErrorFixture.svelte";

test.describe("UploadError - Svelte", () => {
  test("upload failure reaches editor-level onError with UPLOAD_FAILED", async ({
    mount,
    page,
  }) => {
    const component = await mount(UploadErrorFixture);
    await testUploadFailureReachesOnError(component, page);
  });

  test("plugin-system raises a typed INVALID_CONFIG error", async ({ mount, page }) => {
    const component = await mount(UploadErrorFixture);
    await testPluginConfigErrorIsTyped(component, page);
  });
});
