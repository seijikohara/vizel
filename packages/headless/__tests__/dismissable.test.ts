/**
 * Unit tests for the dismissable primitive.
 *
 * The controller owns `document`-level listeners, so the suite stubs a
 * minimal `document` that records `addEventListener` /
 * `removeEventListener` calls and can dispatch a recorded handler. The
 * stub keeps the headless package free of a DOM-emulation dependency.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createVizelDismissable } from "../src/dismissable/index.ts";

interface Registration {
  readonly type: string;
  readonly handler: (event: unknown) => void;
  readonly capture: boolean;
}

interface FakeDocument {
  readonly registrations: Registration[];
  addEventListener(type: string, handler: (event: unknown) => void, capture?: boolean): void;
  removeEventListener(type: string, handler: (event: unknown) => void, capture?: boolean): void;
  dispatch(type: string, event: unknown): void;
}

function createFakeDocument(): FakeDocument {
  const state = { registrations: [] as Registration[] };
  return {
    get registrations() {
      return state.registrations;
    },
    addEventListener: (type, handler, capture = false) => {
      state.registrations.push({ type, handler, capture });
    },
    removeEventListener: (type, handler) => {
      const index = state.registrations.findIndex(
        (entry) => entry.type === type && entry.handler === handler
      );
      if (index !== -1) state.registrations.splice(index, 1);
    },
    dispatch: (type, event) => {
      for (const entry of [...state.registrations]) {
        if (entry.type === type) entry.handler(event);
      }
    },
  };
}

/**
 * Minimal `Node` base so the controller's `event.target instanceof Node`
 * guards pass. Node.js does not define the DOM `Node` interface, so the
 * suite supplies one and makes every fake target extend it.
 */
class FakeNode {
  contains(node: unknown): boolean {
    return node === this;
  }
}

/**
 * Build a fake mount target whose `contains` reports whether a node is
 * the target itself. The dismissable controller calls `target.contains`
 * to decide whether an event originated inside the surface.
 */
function createFakeTarget(): HTMLElement {
  return new FakeNode() as unknown as HTMLElement;
}

describe("createVizelDismissable", () => {
  const fake = { document: createFakeDocument() };

  beforeEach(() => {
    fake.document = createFakeDocument();
    (globalThis as { document?: unknown }).document = fake.document;
    // The pointer and focus handlers narrow `event.target` with
    // `instanceof Node`; expose the fake base as the global `Node` so the
    // guards pass. The controller installs the pointer handler
    // synchronously when `deferPointerHandler` stays false, so a window
    // stub is only needed for the deferred path, which these tests skip.
    (globalThis as { Node?: unknown }).Node = FakeNode;
  });
  afterEach(() => {
    (globalThis as { document?: unknown }).document = undefined;
    (globalThis as { Node?: unknown }).Node = undefined;
  });

  it("attaches pointer, escape, and focus listeners on mount", () => {
    const controller = createVizelDismissable({ onEscape: () => undefined });
    controller.mount(createFakeTarget());

    const types = fake.document.registrations.map((entry) => entry.type).sort();
    assert.deepEqual(types, ["focusin", "keydown", "pointerdown"]);
  });

  it("fires onEscape when the Escape key reaches the keydown handler", () => {
    const calls = { escape: 0 };
    const controller = createVizelDismissable({ onEscape: () => calls.escape++ });
    controller.mount(createFakeTarget());

    fake.document.dispatch("keydown", { key: "ArrowDown" });
    assert.equal(calls.escape, 0);

    fake.document.dispatch("keydown", { key: "Escape" });
    assert.equal(calls.escape, 1);
  });

  it("fires onPointerOutside only for events outside the target", () => {
    const calls = { outside: 0 };
    const target = createFakeTarget();
    const controller = createVizelDismissable({ onPointerOutside: () => calls.outside++ });
    controller.mount(target);

    // Inside the target: no callback.
    fake.document.dispatch("pointerdown", { target });
    assert.equal(calls.outside, 0);

    // Outside the target: callback fires once.
    fake.document.dispatch("pointerdown", { target: createFakeTarget() });
    assert.equal(calls.outside, 1);
  });

  it("detaches every listener on unmount and tolerates repeat calls", () => {
    const controller = createVizelDismissable({ onEscape: () => undefined });
    controller.mount(createFakeTarget());
    controller.unmount();
    controller.unmount();

    assert.equal(fake.document.registrations.length, 0);
  });
});
