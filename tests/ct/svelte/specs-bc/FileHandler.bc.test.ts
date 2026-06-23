import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testAllowedMimeTypes,
  testFileDropSimulation,
  testFileDropTargetExists,
  testFileHandlerExtensionLoaded,
  testFilePasteSimulation,
} from "../../scenarios/file-handler-bc.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("FileHandler (Vitest Browser) - Svelte", () => {
  describe("Extension Setup", () => {
    test("FileHandler extension is loaded", async () => {
      render(EditorFixture);
      await testFileHandlerExtensionLoaded(page.elementLocator(document.body));
    });

    test("file drop target exists", async () => {
      render(EditorFixture);
      await testFileDropTargetExists(page.elementLocator(document.body));
    });

    test("respects allowed MIME types", async () => {
      render(EditorFixture);
      await testAllowedMimeTypes(page.elementLocator(document.body));
    });
  });

  describe("File Events", () => {
    test("handles file drop events", async () => {
      render(EditorFixture);
      await testFileDropSimulation(page.elementLocator(document.body));
    });

    test("handles file paste events", async () => {
      render(EditorFixture);
      await testFilePasteSimulation(page.elementLocator(document.body));
    });
  });
});
