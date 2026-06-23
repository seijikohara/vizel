// The hover and visibility scenarios read getComputedStyle opacity, which is
// zero without the Vizel stylesheet, so the spec loads the SCSS entry.
import "@vizel/core/styles/index.scss";
import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
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

describe("DragHandle (Vitest Browser) - Svelte", () => {
  test("shows drag handle on hover", async () => {
    render(EditorFixture);
    await testDragHandleVisibleOnHover(page.elementLocator(document.body));
  });

  test("hover shows and hides drag handle", async () => {
    render(EditorFixture);
    await testDragHandleHoverBehavior(page.elementLocator(document.body));
  });

  test("drag handle is clickable", async () => {
    render(EditorFixture);
    await testDragHandleIsClickable(page.elementLocator(document.body));
  });

  test("drag handle has correct accessibility attributes", async () => {
    render(EditorFixture);
    await testDragHandleAccessibility(page.elementLocator(document.body));
  });

  test("moves block up with Alt+ArrowUp", async () => {
    render(EditorFixture);
    await testMoveBlockUpWithKeyboard(page.elementLocator(document.body));
  });

  test("moves block down with Alt+ArrowDown", async () => {
    render(EditorFixture);
    await testMoveBlockDownWithKeyboard(page.elementLocator(document.body));
  });

  test("moves heading with keyboard", async () => {
    render(EditorFixture);
    await testMoveHeadingWithKeyboard(page.elementLocator(document.body));
  });

  test("moves list item up with Alt+ArrowUp", async () => {
    render(EditorFixture);
    await testMoveListItemUpWithKeyboard(page.elementLocator(document.body));
  });

  test("moves list item down with Alt+ArrowDown", async () => {
    render(EditorFixture);
    await testMoveListItemDownWithKeyboard(page.elementLocator(document.body));
  });

  test("moves task item with keyboard", async () => {
    render(EditorFixture);
    await testMoveTaskItemWithKeyboard(page.elementLocator(document.body));
  });

  test("reorders a bullet list item by dragging", async () => {
    render(EditorFixture);
    await testDragBulletListItemReorder(page.elementLocator(document.body));
  });

  test("reorders an ordered list item by dragging", async () => {
    render(EditorFixture);
    await testDragOrderedListItemReorder(page.elementLocator(document.body));
  });

  test("preserves task item checked state after drag", async () => {
    render(EditorFixture);
    await testDragTaskItemPreservesCheckState(page.elementLocator(document.body));
  });

  test("reorders a nested list item by dragging", async () => {
    render(EditorFixture);
    await testDragNestedListItemReorder(page.elementLocator(document.body));
  });
});
