import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testImageDeleteWithBackspace,
  testImageDeleteWithDelete,
  testImageInSlashMenu,
  testImageInsertViaSlashCommand,
  testImageRendersWithClass,
  testImageSelection,
  testUploadImageInSlashMenu,
} from "../../scenarios/image.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("Image (Vitest Browser) - Svelte", () => {
  describe("Display", () => {
    test("can be inserted via slash command", async () => {
      render(EditorFixture);
      await testImageInsertViaSlashCommand(page.elementLocator(document.body));
    });

    test("renders with correct CSS class", async () => {
      render(EditorFixture);
      await testImageRendersWithClass(page.elementLocator(document.body));
    });

    test("image command appears in slash menu", async () => {
      render(EditorFixture);
      await testImageInSlashMenu(page.elementLocator(document.body));
    });

    test("upload image command appears in slash menu", async () => {
      render(EditorFixture);
      await testUploadImageInSlashMenu(page.elementLocator(document.body));
    });
  });

  describe("Mouse Operations", () => {
    test("can be selected by clicking", async () => {
      render(EditorFixture);
      await testImageSelection(page.elementLocator(document.body));
    });
  });

  describe("Keyboard Operations", () => {
    test("can be deleted with Backspace key", async () => {
      render(EditorFixture);
      await testImageDeleteWithBackspace(page.elementLocator(document.body));
    });

    test("can be deleted with Delete key", async () => {
      render(EditorFixture);
      await testImageDeleteWithDelete(page.elementLocator(document.body));
    });
  });
});
