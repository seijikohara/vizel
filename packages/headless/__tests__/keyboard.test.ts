/**
 * Unit tests for the keyboard navigation primitive.
 *
 * The pure-builder suites assert boundary and wraparound behaviour. The
 * controller suites stub the three DOM operations the controllers touch
 * (`querySelectorAll`, `addEventListener`, `removeEventListener`) and a
 * minimal `document` so the SSR guard treats the run as a browser. The
 * stub avoids a DOM-emulation dependency the headless package does not
 * otherwise need.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  buildVizelGridNavSpec,
  buildVizelListNavSpec,
  createVizelKeyboardGridController,
  createVizelKeyboardListController,
} from "../src/keyboard/index.ts";

describe("buildVizelListNavSpec", () => {
  it("moves down and up within bounds", () => {
    assert.equal(buildVizelListNavSpec({ key: "ArrowDown", currentIndex: 0, length: 3 }), 1);
    assert.equal(buildVizelListNavSpec({ key: "ArrowUp", currentIndex: 2, length: 3 }), 1);
  });

  it("wraps around both edges", () => {
    assert.equal(buildVizelListNavSpec({ key: "ArrowDown", currentIndex: 2, length: 3 }), 0);
    assert.equal(buildVizelListNavSpec({ key: "ArrowUp", currentIndex: 0, length: 3 }), 2);
  });

  it("jumps to the first and last item", () => {
    assert.equal(buildVizelListNavSpec({ key: "Home", currentIndex: 2, length: 3 }), 0);
    assert.equal(buildVizelListNavSpec({ key: "End", currentIndex: 0, length: 3 }), 2);
  });

  it("returns null for an empty list and for unhandled keys", () => {
    assert.equal(buildVizelListNavSpec({ key: "ArrowDown", currentIndex: 0, length: 0 }), null);
    assert.equal(buildVizelListNavSpec({ key: "Tab", currentIndex: 0, length: 3 }), null);
    assert.equal(buildVizelListNavSpec({ key: "a", currentIndex: 0, length: 3 }), null);
  });
});

describe("buildVizelGridNavSpec", () => {
  const length = 8;
  const columns = 4;

  it("moves one cell horizontally and clamps at the edges", () => {
    assert.equal(buildVizelGridNavSpec({ key: "ArrowRight", currentIndex: 0, length, columns }), 1);
    assert.equal(buildVizelGridNavSpec({ key: "ArrowLeft", currentIndex: 1, length, columns }), 0);
    // Already at the last cell: ArrowRight clamps in place.
    assert.equal(buildVizelGridNavSpec({ key: "ArrowRight", currentIndex: 7, length, columns }), 7);
    // Already at the first cell: ArrowLeft clamps in place.
    assert.equal(buildVizelGridNavSpec({ key: "ArrowLeft", currentIndex: 0, length, columns }), 0);
  });

  it("moves one row vertically and stays put at the vertical edges", () => {
    assert.equal(buildVizelGridNavSpec({ key: "ArrowDown", currentIndex: 1, length, columns }), 5);
    assert.equal(buildVizelGridNavSpec({ key: "ArrowUp", currentIndex: 5, length, columns }), 1);
    // Last row: ArrowDown would leave the grid, so it stays put.
    assert.equal(buildVizelGridNavSpec({ key: "ArrowDown", currentIndex: 5, length, columns }), 5);
    // First row: ArrowUp stays put.
    assert.equal(buildVizelGridNavSpec({ key: "ArrowUp", currentIndex: 1, length, columns }), 1);
  });

  it("jumps to the first and last cell", () => {
    assert.equal(buildVizelGridNavSpec({ key: "Home", currentIndex: 5, length, columns }), 0);
    assert.equal(buildVizelGridNavSpec({ key: "End", currentIndex: 0, length, columns }), 7);
  });

  it("returns null for an empty grid, non-positive columns, and unhandled keys", () => {
    assert.equal(
      buildVizelGridNavSpec({ key: "ArrowRight", currentIndex: 0, length: 0, columns }),
      null
    );
    assert.equal(
      buildVizelGridNavSpec({ key: "ArrowRight", currentIndex: 0, length, columns: 0 }),
      null
    );
    assert.equal(buildVizelGridNavSpec({ key: "Enter", currentIndex: 0, length, columns }), null);
  });
});

/**
 * Minimal stand-in for the subset of `HTMLElement` the controllers use:
 * `querySelectorAll(selector).length`, `addEventListener`, and
 * `removeEventListener` for the `keydown` event.
 */
interface FakeRoot {
  readonly itemCount: number;
  readonly listeners: ((event: KeyboardEvent) => void)[];
  querySelectorAll(selector: string): { readonly length: number };
  addEventListener(type: string, handler: (event: KeyboardEvent) => void): void;
  removeEventListener(type: string, handler: (event: KeyboardEvent) => void): void;
  dispatch(event: KeyboardEvent): void;
}

function createFakeRoot(itemCount: number): FakeRoot {
  const state = { listeners: [] as ((event: KeyboardEvent) => void)[] };
  return {
    itemCount,
    get listeners() {
      return state.listeners;
    },
    querySelectorAll: () => ({ length: itemCount }),
    addEventListener: (type, handler) => {
      if (type === "keydown") state.listeners.push(handler);
    },
    removeEventListener: (type, handler) => {
      if (type !== "keydown") return;
      const index = state.listeners.indexOf(handler);
      if (index !== -1) state.listeners.splice(index, 1);
    },
    dispatch: (event) => {
      // oxlint-disable-next-line unicorn/no-useless-spread -- snapshot before iterating so a handler unregistering itself mid-dispatch cannot skip entries
      for (const handler of [...state.listeners]) handler(event);
    },
  };
}

/**
 * Build a `KeyboardEvent`-shaped object that records `preventDefault`
 * and `stopPropagation` calls. The controllers read only `event.key`
 * and invoke the two methods; a full `KeyboardEvent` is unnecessary.
 */
function createKeyEvent(key: string): KeyboardEvent & {
  readonly preventedDefault: () => boolean;
  readonly stoppedPropagation: () => boolean;
} {
  const calls = { preventDefault: false, stopPropagation: false };
  const event = {
    key,
    preventDefault: () => {
      calls.preventDefault = true;
    },
    stopPropagation: () => {
      calls.stopPropagation = true;
    },
    preventedDefault: () => calls.preventDefault,
    stoppedPropagation: () => calls.stopPropagation,
  };
  return event as unknown as KeyboardEvent & {
    readonly preventedDefault: () => boolean;
    readonly stoppedPropagation: () => boolean;
  };
}

describe("createVizelKeyboardListController", () => {
  // The SSR guard reads the global `document`; define a sentinel so the
  // controller treats the test run as a browser. The value is never
  // dereferenced beyond the `typeof` check.
  beforeEach(() => {
    (globalThis as { document?: unknown }).document = {};
  });
  afterEach(() => {
    (globalThis as { document?: unknown }).document = undefined;
  });

  it("attaches a keydown listener on mount and applies navigation", () => {
    const root = createFakeRoot(3);
    const changes: number[] = [];
    const controller = createVizelKeyboardListController({
      getRoot: () => root as unknown as HTMLElement,
      onChange: (index) => changes.push(index),
    });

    controller.mount();
    assert.equal(root.listeners.length, 1);

    const event = createKeyEvent("ArrowDown");
    root.dispatch(event);
    assert.deepEqual(changes, [1]);
    assert.equal(controller.getSelectedIndex(), 1);
    assert.equal(event.preventedDefault(), true);
    assert.equal(event.stoppedPropagation(), true);
  });

  it("does not fire onChange for an unhandled key", () => {
    const root = createFakeRoot(3);
    const changes: number[] = [];
    const controller = createVizelKeyboardListController({
      getRoot: () => root as unknown as HTMLElement,
      onChange: (index) => changes.push(index),
    });

    assert.equal(controller.handleKey(createKeyEvent("Tab")), false);
    assert.deepEqual(changes, []);
  });

  it("detaches the listener on unmount and is idempotent", () => {
    const root = createFakeRoot(3);
    const controller = createVizelKeyboardListController({
      getRoot: () => root as unknown as HTMLElement,
      onChange: () => undefined,
    });

    controller.mount();
    controller.unmount();
    controller.unmount();
    assert.equal(root.listeners.length, 0);
  });

  it("honours initialIndex and setSelectedIndex", () => {
    const root = createFakeRoot(3);
    const controller = createVizelKeyboardListController({
      getRoot: () => root as unknown as HTMLElement,
      onChange: () => undefined,
      initialIndex: 2,
    });
    assert.equal(controller.getSelectedIndex(), 2);
    controller.setSelectedIndex(1);
    assert.equal(controller.getSelectedIndex(), 1);
  });
});

describe("createVizelKeyboardGridController", () => {
  beforeEach(() => {
    (globalThis as { document?: unknown }).document = {};
  });
  afterEach(() => {
    (globalThis as { document?: unknown }).document = undefined;
  });

  it("applies grid navigation through the mounted listener", () => {
    const root = createFakeRoot(8);
    const changes: number[] = [];
    const controller = createVizelKeyboardGridController({
      getRoot: () => root as unknown as HTMLElement,
      columns: 4,
      onChange: (index) => changes.push(index),
    });

    controller.mount();
    root.dispatch(createKeyEvent("ArrowDown"));
    assert.deepEqual(changes, [4]);
    assert.equal(controller.getSelectedIndex(), 4);
  });

  it("returns false from handleKey when getRoot yields null", () => {
    const controller = createVizelKeyboardGridController({
      getRoot: () => null,
      columns: 4,
      onChange: () => undefined,
    });
    assert.equal(controller.handleKey(createKeyEvent("ArrowDown")), false);
  });
});
