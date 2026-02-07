import { test } from "@playwright/experimental-ct-vue";
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

test.describe("User Flows - Vue", () => {
  test("document creation flow", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testDocumentCreationFlow(component, page);
  });

  test("markdown round-trip flow", async ({ mount, page }) => {
    const component = await mount(UserFlowFixture, {
      props: { mode: "markdown" },
    });
    await testMarkdownRoundTrip(component, page);
  });

  test("auto-save flow", async ({ mount, page }) => {
    const component = await mount(UserFlowFixture, {
      props: { mode: "auto-save", storageKey: AUTO_SAVE_KEY },
    });
    await testAutoSaveFlow(component, page, AUTO_SAVE_KEY);
  });

  test("image upload flow", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testImageUploadFlow(component, page);
  });

  test("table editing flow", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testTableEditingFlow(component, page);
  });
});
