import { describe, test } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

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

describe("UserFlows (Vitest Browser) - React", () => {
  test("document creation flow", async () => {
    await render(<EditorFixture />);
    await testDocumentCreationFlow(page.elementLocator(document.body));
  });

  test("markdown round-trip flow", async () => {
    await render(<UserFlowFixture mode="markdown" />);
    await testMarkdownRoundTrip(page.elementLocator(document.body));
  });

  test("auto-save flow", async () => {
    await render(<UserFlowFixture mode="auto-save" storageKey={AUTO_SAVE_KEY} />);
    await testAutoSaveFlow(AUTO_SAVE_KEY);
  });

  test("image upload flow", async () => {
    await render(<EditorFixture />);
    await testImageUploadFlow(page.elementLocator(document.body));
  });

  test("table editing flow", async () => {
    await render(<EditorFixture />);
    await testTableEditingFlow(page.elementLocator(document.body));
  });
});
