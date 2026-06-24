// The resize tooltip toggles via `display: block/none` and the assertions read
// img.offsetWidth, so the editor styles must load for the layout to compute.
import "@vizel/core/styles/index.scss";
import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
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
import { EditorFixture } from "./EditorFixture";

describe("ImageResize (Vitest Browser) - React", () => {
  describe("Display", () => {
    test("resize wrapper is rendered around image", async () => {
      await render(<EditorFixture />);
      await testResizeWrapperRendered(page.elementLocator(document.body));
    });

    test("left resize handle exists", async () => {
      await render(<EditorFixture />);
      await testLeftResizeHandleExists(page.elementLocator(document.body));
    });

    test("right resize handle exists", async () => {
      await render(<EditorFixture />);
      await testRightResizeHandleExists(page.elementLocator(document.body));
    });
  });

  describe("Mouse Operations", () => {
    test("can be resized by dragging right handle", async () => {
      await render(<EditorFixture />);
      await testResizeWithRightHandle(page.elementLocator(document.body));
    });

    test("can be resized by dragging left handle", async () => {
      await render(<EditorFixture />);
      await testResizeWithLeftHandle(page.elementLocator(document.body));
    });

    test("tooltip appears during resize", async () => {
      await render(<EditorFixture />);
      await testResizeTooltipAppears(page.elementLocator(document.body));
    });

    test("minimum width constraint is enforced", async () => {
      await render(<EditorFixture />);
      await testMinWidthConstraint(page.elementLocator(document.body));
    });

    test("aspect ratio is maintained during resize", async () => {
      await render(<EditorFixture />);
      await testAspectRatioMaintained(page.elementLocator(document.body));
    });
  });
});
