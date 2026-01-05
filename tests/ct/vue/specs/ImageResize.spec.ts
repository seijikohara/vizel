import { test } from "@playwright/experimental-ct-vue";
import {
  testAspectRatioMaintained,
  testLeftResizeHandleExists,
  testMinWidthConstraint,
  testResizeTooltipAppears,
  testResizeWithLeftHandle,
  testResizeWithRightHandle,
  testResizeWrapperRendered,
  testRightResizeHandleExists,
} from "../../scenarios/image-resize.scenario";
import EditorFixture from "./EditorFixture.vue";

test.describe("ImageResize - Vue", () => {
  test.describe("Display", () => {
    test("resize wrapper is rendered around image", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testResizeWrapperRendered(component, page);
    });

    test("left resize handle exists", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testLeftResizeHandleExists(component, page);
    });

    test("right resize handle exists", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testRightResizeHandleExists(component, page);
    });
  });

  test.describe("Mouse Operations", () => {
    test("can be resized by dragging right handle", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testResizeWithRightHandle(component, page);
    });

    test("can be resized by dragging left handle", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testResizeWithLeftHandle(component, page);
    });

    test("tooltip appears during resize", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testResizeTooltipAppears(component, page);
    });

    test("minimum width constraint is enforced", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMinWidthConstraint(component, page);
    });

    test("aspect ratio is maintained during resize", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testAspectRatioMaintained(component, page);
    });
  });
});
