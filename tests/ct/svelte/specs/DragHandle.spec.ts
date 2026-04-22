import { test } from "@playwright/experimental-ct-svelte";
import {
  testDragBulletListItemReorder,
  testDragHandleAccessibility,
  testDragHandleHoverBehavior,
  testDragHandleIsClickable,
  testDragHandleVisibleOnHover,
  testDragNestedListItemReorder,
  testDragOrderedListItemReorder,
  testDragTaskItemPreservesCheckState,
  testMoveBlockDownWithKeyboard,
  testMoveBlockUpWithKeyboard,
  testMoveHeadingWithKeyboard,
  testMoveListItemDownWithKeyboard,
  testMoveListItemUpWithKeyboard,
  testMoveTaskItemWithKeyboard,
} from "../../scenarios/drag-handle.scenario";
import EditorFixture from "./EditorFixture.svelte";

test.describe("DragHandle - Svelte", () => {
  test.describe("Visibility", () => {
    test("shows drag handle on hover", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testDragHandleVisibleOnHover(component, page);
    });

    test("hover shows and hides drag handle", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testDragHandleHoverBehavior(component, page);
    });
  });

  test.describe("Mouse Operations", () => {
    test("drag handle is clickable", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testDragHandleIsClickable(component, page);
    });

    test("drag handle has correct accessibility attributes", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testDragHandleAccessibility(component, page);
    });
  });

  test.describe("Keyboard Operations", () => {
    test("moves block up with Alt+ArrowUp", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMoveBlockUpWithKeyboard(component, page);
    });

    test("moves block down with Alt+ArrowDown", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMoveBlockDownWithKeyboard(component, page);
    });

    test("moves heading with keyboard", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMoveHeadingWithKeyboard(component, page);
    });

    test("moves list item up with Alt+ArrowUp", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMoveListItemUpWithKeyboard(component, page);
    });

    test("moves list item down with Alt+ArrowDown", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMoveListItemDownWithKeyboard(component, page);
    });

    test("moves task item with keyboard", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMoveTaskItemWithKeyboard(component, page);
    });
  });

  test.describe("Drag-and-Drop Reordering", () => {
    test("reorders a bullet list item by dragging", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testDragBulletListItemReorder(component, page);
    });

    test("reorders an ordered list item by dragging", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testDragOrderedListItemReorder(component, page);
    });

    test("preserves task item checked state after drag", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testDragTaskItemPreservesCheckState(component, page);
    });

    test("reorders a nested list item by dragging", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testDragNestedListItemReorder(component, page);
    });
  });
});
