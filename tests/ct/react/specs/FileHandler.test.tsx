import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testAllowedMimeTypes,
  testFileDropSimulation,
  testFileDropTargetExists,
  testFileHandlerExtensionLoaded,
  testFilePasteSimulation,
} from "../../scenarios/file-handler.scenario";
import { EditorFixture } from "./EditorFixture";

describe("FileHandler (Vitest Browser) - React", () => {
  describe("Extension Setup", () => {
    test("FileHandler extension is loaded", async () => {
      await render(<EditorFixture />);
      await testFileHandlerExtensionLoaded(page.elementLocator(document.body));
    });

    test("file drop target exists", async () => {
      await render(<EditorFixture />);
      await testFileDropTargetExists(page.elementLocator(document.body));
    });

    test("respects allowed MIME types", async () => {
      await render(<EditorFixture />);
      await testAllowedMimeTypes(page.elementLocator(document.body));
    });
  });

  describe("File Events", () => {
    test("handles file drop events", async () => {
      await render(<EditorFixture />);
      await testFileDropSimulation(page.elementLocator(document.body));
    });

    test("handles file paste events", async () => {
      await render(<EditorFixture />);
      await testFilePasteSimulation(page.elementLocator(document.body));
    });
  });
});
