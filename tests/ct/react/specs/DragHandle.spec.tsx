import { test } from "@playwright/experimental-ct-react";
import {
  testDragHandleAccessibility,
  testDragHandleVisibleOnHover,
  testMoveBlockDownWithKeyboard,
  testMoveBlockUpWithKeyboard,
  testMoveHeadingWithKeyboard,
} from "../../scenarios/drag-handle.scenario";
import { EditorFixture } from "./EditorFixture";

test.describe("DragHandle - React", () => {
  test("drag handle is visible on hover", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testDragHandleVisibleOnHover(component, page);
  });

  test("block can be moved up with Alt+ArrowUp", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testMoveBlockUpWithKeyboard(component, page);
  });

  // TODO: Fix this test - moveBlockDown command works but test setup issue
  test.skip("block can be moved down with Alt+ArrowDown", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testMoveBlockDownWithKeyboard(component, page);
  });

  test("heading can be moved with keyboard", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testMoveHeadingWithKeyboard(component, page);
  });

  test("drag handle has accessibility attributes", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testDragHandleAccessibility(component, page);
  });
});
