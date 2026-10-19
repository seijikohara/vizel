import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";
import { page } from "vitest/browser";

import {
  testAutoSaveFlow,
  testDocumentCreationFlow,
  testImageUploadFlow,
  testMarkdownRoundTrip,
  testTableEditingFlow,
} from "../../scenarios/user-flows.scenario";
import EditorFixture from "./EditorFixture.vue";
import UserFlowFixture from "./UserFlowFixture.vue";

const AUTO_SAVE_KEY = "vizel-test-auto-save-vue";

describe("UserFlows (Vitest Browser) - Vue", () => {
  test("document creation flow", async () => {
    await render(EditorFixture);
    await testDocumentCreationFlow(page.elementLocator(document.body));
  });

  test("markdown round-trip flow", async () => {
    await render(UserFlowFixture, { props: { mode: "markdown" } });
    await testMarkdownRoundTrip(page.elementLocator(document.body));
  });

  test("auto-save flow", async () => {
    await render(UserFlowFixture, { props: { mode: "auto-save", storageKey: AUTO_SAVE_KEY } });
    await testAutoSaveFlow(AUTO_SAVE_KEY);
  });

  test("image upload flow", async () => {
    await render(EditorFixture);
    await testImageUploadFlow(page.elementLocator(document.body));
  });

  test("table editing flow", async () => {
    await render(EditorFixture);
    await testTableEditingFlow(page.elementLocator(document.body));
  });
});
