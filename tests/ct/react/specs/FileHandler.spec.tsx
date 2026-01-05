import { test } from "@playwright/experimental-ct-react";
import {
  testAllowedMimeTypes,
  testFileDropSimulation,
  testFileDropTargetExists,
  testFileHandlerExtensionLoaded,
  testFilePasteSimulation,
} from "../../scenarios/file-handler.scenario";
import { EditorFixture } from "./EditorFixture";

test.describe("FileHandler - React", () => {
  test.describe("Extension Setup", () => {
    test("FileHandler extension is loaded", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testFileHandlerExtensionLoaded(component, page);
    });

    test("file drop target exists", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testFileDropTargetExists(component, page);
    });

    test("respects allowed MIME types", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testAllowedMimeTypes(component, page);
    });
  });

  test.describe("File Events", () => {
    test("handles file drop events", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testFileDropSimulation(component, page);
    });

    test("handles file paste events", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testFilePasteSimulation(component, page);
    });
  });
});
