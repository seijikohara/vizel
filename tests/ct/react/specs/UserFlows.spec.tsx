import { test } from "@playwright/experimental-ct-react";
import {
  testAutoSaveFlow,
  testDocumentCreationFlow,
  testImageUploadFlow,
  testMarkdownRoundTrip,
  testTableEditingFlow,
} from "../../scenarios/user-flows.scenario";
import { EditorFixture } from "./EditorFixture";
import { UserFlowFixture } from "./UserFlowFixture";

const AUTO_SAVE_KEY = "vizel-test-auto-save-react";

test.describe("User Flows - React", () => {
  test("document creation flow", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testDocumentCreationFlow(component, page);
  });

  test("markdown round-trip flow", async ({ mount, page }) => {
    const component = await mount(<UserFlowFixture mode="markdown" />);
    await testMarkdownRoundTrip(component, page);
  });

  test("auto-save flow", async ({ mount, page }) => {
    const component = await mount(<UserFlowFixture mode="auto-save" storageKey={AUTO_SAVE_KEY} />);
    await testAutoSaveFlow(component, page, AUTO_SAVE_KEY);
  });

  test("image upload flow", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testImageUploadFlow(component, page);
  });

  test("table editing flow", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testTableEditingFlow(component, page);
  });
});
