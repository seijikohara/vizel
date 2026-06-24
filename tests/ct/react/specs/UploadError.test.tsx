import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testPluginConfigErrorIsTyped,
  testUploadFailureReachesOnError,
} from "../../scenarios/error-model.scenario";
import { UploadErrorFixture } from "./UploadErrorFixture";

describe("UploadError (Vitest Browser) - React", () => {
  test("upload failure reaches editor-level onError with UPLOAD_FAILED", async () => {
    await render(<UploadErrorFixture />);
    await testUploadFailureReachesOnError(page.elementLocator(document.body));
  });

  test("plugin-system raises a typed INVALID_CONFIG error", async () => {
    await render(<UploadErrorFixture />);
    await testPluginConfigErrorIsTyped(page.elementLocator(document.body));
  });
});
