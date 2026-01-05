import { test } from "@playwright/experimental-ct-react";
import {
  testImageDeleteWithBackspace,
  testImageDeleteWithDelete,
  testImageInSlashMenu,
  testImageInsertViaSlashCommand,
  testImageRendersWithClass,
  testImageSelection,
  testUploadImageInSlashMenu,
} from "../../scenarios/image.scenario";
import { EditorFixture } from "./EditorFixture";

test.describe("Image - React", () => {
  test.describe("Display", () => {
    test("can be inserted via slash command", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testImageInsertViaSlashCommand(component, page);
    });

    test("renders with correct CSS class", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testImageRendersWithClass(component, page);
    });

    test("image command appears in slash menu", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testImageInSlashMenu(component, page);
    });

    test("upload image command appears in slash menu", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testUploadImageInSlashMenu(component, page);
    });
  });

  test.describe("Mouse Operations", () => {
    test("can be selected by clicking", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testImageSelection(component, page);
    });
  });

  test.describe("Keyboard Operations", () => {
    test("can be deleted with Backspace key", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testImageDeleteWithBackspace(component, page);
    });

    test("can be deleted with Delete key", async ({ mount, page }) => {
      const component = await mount(<EditorFixture />);
      await testImageDeleteWithDelete(component, page);
    });
  });
});
