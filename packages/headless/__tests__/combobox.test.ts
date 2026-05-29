/**
 * Unit tests for the combobox primitive.
 *
 * The pure-resolver suite asserts that {@link buildVizelComboboxKeySpec}
 * delegates navigation to the keyboard primitive and adds the
 * combobox-specific verbs. The controller suite builds a minimal fake DOM —
 * an element that records attribute writes and `keydown` listeners, plus
 * `[role=option]` children with mutable ids — so the headless package stays
 * free of a DOM-emulation dependency, matching the dismissable, keyboard,
 * and focus-trap suites.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { buildVizelComboboxKeySpec, createVizelComboboxController } from "../src/combobox/index.ts";

describe("buildVizelComboboxKeySpec", () => {
  it("maps arrows and Home/End to navigate, delegating to the list resolver", () => {
    assert.deepEqual(buildVizelComboboxKeySpec({ key: "ArrowDown", currentIndex: 0, length: 3 }), {
      type: "navigate",
      index: 1,
    });
    assert.deepEqual(buildVizelComboboxKeySpec({ key: "ArrowUp", currentIndex: 1, length: 3 }), {
      type: "navigate",
      index: 0,
    });
    assert.deepEqual(buildVizelComboboxKeySpec({ key: "Home", currentIndex: 2, length: 3 }), {
      type: "navigate",
      index: 0,
    });
    assert.deepEqual(buildVizelComboboxKeySpec({ key: "End", currentIndex: 0, length: 3 }), {
      type: "navigate",
      index: 2,
    });
  });

  it("wraps the navigate index at both edges, inheriting list wraparound", () => {
    assert.deepEqual(buildVizelComboboxKeySpec({ key: "ArrowDown", currentIndex: 2, length: 3 }), {
      type: "navigate",
      index: 0,
    });
    assert.deepEqual(buildVizelComboboxKeySpec({ key: "ArrowUp", currentIndex: 0, length: 3 }), {
      type: "navigate",
      index: 2,
    });
  });

  it("maps Enter to select with the current index", () => {
    assert.deepEqual(buildVizelComboboxKeySpec({ key: "Enter", currentIndex: 2, length: 3 }), {
      type: "select",
      index: 2,
    });
  });

  it("maps Escape to close", () => {
    assert.deepEqual(buildVizelComboboxKeySpec({ key: "Escape", currentIndex: 1, length: 3 }), {
      type: "close",
    });
  });

  it("maps Tab to groupNext", () => {
    assert.deepEqual(buildVizelComboboxKeySpec({ key: "Tab", currentIndex: 0, length: 3 }), {
      type: "groupNext",
    });
  });

  it("returns null for an unhandled key", () => {
    assert.equal(buildVizelComboboxKeySpec({ key: "a", currentIndex: 0, length: 3 }), null);
  });

  it("returns null for every key when the menu is empty", () => {
    // The empty-menu fall-through preserves the pre-adoption behaviour: an
    // open-but-empty menu lets Tiptap consume Enter, Tab, and the arrows.
    for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab", "Home", "End"]) {
      assert.equal(buildVizelComboboxKeySpec({ key, currentIndex: 0, length: 0 }), null);
    }
  });
});

/**
 * Minimal stand-in for the element subset the controller touches:
 * attribute reads / writes, `keydown` listeners, and a `[role=option]`
 * query that returns seeded children. The controller reads only `event.key`
 * plus `preventDefault` / `stopPropagation`, so a full `KeyboardEvent` is
 * unnecessary.
 */
class FakeElement {
  readonly children: FakeElement[] = [];
  readonly listeners: ((event: KeyboardEvent) => void)[] = [];
  readonly attributes = new Map<string, string>();
  id = "";

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  querySelectorAll(_selector: string): FakeElement[] {
    // The controller queries `[role=option]`; the fake returns the seeded
    // option children directly.
    return [...this.children];
  }

  addEventListener(type: string, handler: (event: KeyboardEvent) => void): void {
    if (type === "keydown") this.listeners.push(handler);
  }

  removeEventListener(type: string, handler: (event: KeyboardEvent) => void): void {
    if (type !== "keydown") return;
    const index = this.listeners.indexOf(handler);
    if (index !== -1) this.listeners.splice(index, 1);
  }

  dispatchKeydown(key: string): { readonly prevented: boolean } {
    const calls = { prevented: false };
    const event = {
      key,
      preventDefault: () => {
        calls.prevented = true;
      },
      stopPropagation: () => undefined,
    } as unknown as KeyboardEvent;
    for (const handler of [...this.listeners]) handler(event);
    return calls;
  }
}

function asElement(element: FakeElement): HTMLElement {
  return element as unknown as HTMLElement;
}

/**
 * Build a listbox root seeded with `count` `[role=option]` children.
 */
function createListbox(count: number): FakeElement {
  const root = new FakeElement();
  for (const _ of Array.from({ length: count })) {
    root.children.push(new FakeElement());
  }
  return root;
}

describe("createVizelComboboxController", () => {
  // The SSR guard reads the global `document`; define a sentinel so the
  // controller treats the run as a browser. The value is never dereferenced
  // beyond the `typeof` check.
  beforeEach(() => {
    (globalThis as { document?: unknown }).document = {};
  });
  afterEach(() => {
    (globalThis as { document?: unknown }).document = undefined;
  });

  it("sets aria-expanded on the owner and points activedescendant at the first option on mount", () => {
    const root = createListbox(3);
    const owner = new FakeElement();
    const controller = createVizelComboboxController({
      getRoot: () => asElement(root),
      getOwner: () => asElement(owner),
      onChange: () => undefined,
    });

    controller.mount();

    assert.equal(owner.getAttribute("aria-expanded"), "true");
    // The mount assigned a deterministic id to the first option and pointed
    // the root at it.
    assert.notEqual(root.children[0].id, "");
    assert.equal(root.getAttribute("aria-activedescendant"), root.children[0].id);
  });

  it("preserves an option's existing id rather than overwriting it", () => {
    const root = createListbox(2);
    root.children[0].id = "existing-id";
    const controller = createVizelComboboxController({
      getRoot: () => asElement(root),
      onChange: () => undefined,
    });

    controller.mount();
    assert.equal(root.getAttribute("aria-activedescendant"), "existing-id");
  });

  it("moves selection and activedescendant on arrow navigation", () => {
    const root = createListbox(3);
    const changes: number[] = [];
    const controller = createVizelComboboxController({
      getRoot: () => asElement(root),
      onChange: (index) => changes.push(index),
    });

    controller.mount();
    const result = root.dispatchKeydown("ArrowDown");

    assert.equal(result.prevented, true);
    assert.deepEqual(changes, [1]);
    assert.equal(controller.getSelectedIndex(), 1);
    assert.equal(root.getAttribute("aria-activedescendant"), root.children[1].id);
  });

  it("invokes onSelect with the current index on Enter and leaves it to the caller", () => {
    const root = createListbox(3);
    const selected: number[] = [];
    const controller = createVizelComboboxController({
      getRoot: () => asElement(root),
      onChange: () => undefined,
      onSelect: (index) => selected.push(index),
    });

    controller.mount();
    root.dispatchKeydown("ArrowDown");
    root.dispatchKeydown("Enter");

    assert.deepEqual(selected, [1]);
  });

  it("invokes onClose on Escape", () => {
    const root = createListbox(2);
    const calls = { closed: 0 };
    const controller = createVizelComboboxController({
      getRoot: () => asElement(root),
      onChange: () => undefined,
      onClose: () => {
        calls.closed += 1;
      },
    });

    controller.mount();
    const result = root.dispatchKeydown("Escape");

    assert.equal(result.prevented, true);
    assert.equal(calls.closed, 1);
  });

  it("reports Tab as unhandled so the listener-owning surface keeps grouping", () => {
    const root = createListbox(3);
    const controller = createVizelComboboxController({
      getRoot: () => asElement(root),
      onChange: () => undefined,
    });

    controller.mount();
    // Tab resolves to groupNext, which the controller cannot target without
    // feature-specific knowledge; it returns the key as unhandled.
    const result = root.dispatchKeydown("Tab");
    assert.equal(result.prevented, false);
  });

  it("syncs activedescendant when update is called for an external selection", () => {
    const root = createListbox(3);
    const controller = createVizelComboboxController({
      getRoot: () => asElement(root),
      onChange: () => undefined,
    });

    controller.mount();
    controller.update(2);

    assert.equal(controller.getSelectedIndex(), 2);
    assert.equal(root.getAttribute("aria-activedescendant"), root.children[2].id);
  });

  it("removes the ARIA wiring on unmount and is idempotent", () => {
    const root = createListbox(2);
    const owner = new FakeElement();
    const controller = createVizelComboboxController({
      getRoot: () => asElement(root),
      getOwner: () => asElement(owner),
      onChange: () => undefined,
    });

    controller.mount();
    assert.equal(root.listeners.length, 1);

    controller.unmount();
    controller.unmount();

    assert.equal(root.listeners.length, 0);
    assert.equal(root.getAttribute("aria-activedescendant"), null);
    assert.equal(owner.getAttribute("aria-expanded"), null);
  });
});
