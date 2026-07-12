import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import {
  testAutoSaveFlow,
  testDocumentCreationFlow,
  testImageUploadFlow,
  testMarkdownRoundTrip,
  testTableEditingFlow,
} from "../../scenarios/user-flows.scenario";
import EditorFixture from "./EditorFixture.svelte";
import UserFlowFixture from "./UserFlowFixture.svelte";

const AUTO_SAVE_KEY = "vizel-test-auto-save-svelte";

describe("UserFlows (Vitest Browser) - Svelte", () => {
  test("document creation flow", async () => {
    render(EditorFixture);
    await testDocumentCreationFlow(page.elementLocator(document.body));
  });

  test("markdown round-trip flow", async () => {
    render(UserFlowFixture, { props: { mode: "markdown" } });
    await testMarkdownRoundTrip(page.elementLocator(document.body));
  });

  test("auto-save flow", async () => {
    render(UserFlowFixture, { props: { mode: "auto-save", storageKey: AUTO_SAVE_KEY } });
    await testAutoSaveFlow(AUTO_SAVE_KEY);
  });

  test("image upload flow", async () => {
    render(EditorFixture);
    await testImageUploadFlow(page.elementLocator(document.body));
  });

  test("table editing flow", async () => {
    render(EditorFixture);
    await testTableEditingFlow(page.elementLocator(document.body));
  });
});
