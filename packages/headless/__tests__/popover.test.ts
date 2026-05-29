/**
 * Unit tests for the anchored popover primitive.
 *
 * The popover composes the floating positioning controller with the
 * dismissable listener wiring. The suite mocks `@floating-ui/dom` so the
 * floating sub-controller stays inert, then drives the dismiss behaviour
 * through a fake `document` (the PR-1 dismissable pattern). The critical
 * assertions cover the anchor-containment exclusion: a pointer event on
 * the trigger must not dismiss, matching the legacy core controller's
 * multi-element "outside" set.
 *
 * Module mocking needs the `--experimental-test-module-mocks` flag, which
 * the package `test` script supplies.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

// Stub `@floating-ui/dom` so the popover's floating sub-controller does
// not reach for real layout geometry. The popover suite asserts dismiss
// behaviour only; positioning is covered by floating.test.ts.
mock.module("@floating-ui/dom", {
  namedExports: {
    computePosition: () => Promise.resolve({ x: 0, y: 0 }),
    autoUpdate: () => () => undefined,
    offset: () => ({ name: "offset" }),
    flip: () => ({ name: "flip" }),
    shift: () => ({ name: "shift" }),
  },
});

const { createVizelPopoverController, buildVizelPopoverPositionSpec } = await import(
  "../src/popover/index.ts"
);

interface Registration {
  readonly type: string;
  readonly handler: (event: unknown) => void;
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
    addEventListener: (type, handler) => {
      state.registrations.push({ type, handler });
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
 * Minimal DOM node whose `contains` reports self-containment plus an
 * explicit child list. The popover controller calls `contains` on the
 * anchor and the body to classify a pointer event.
 */
class FakeNode {
  readonly children: FakeNode[];
  readonly style: Record<string, string> = {};

  constructor(children: FakeNode[] = []) {
    this.children = children;
  }

  contains(node: unknown): boolean {
    return node === this || this.children.some((child) => child.contains(node));
  }
}

describe("buildVizelPopoverPositionSpec", () => {
  it("re-exports the floating spec defaults", () => {
    assert.deepEqual(buildVizelPopoverPositionSpec(), { placement: "bottom-start", offset: 4 });
  });
});

describe("createVizelPopoverController dismiss semantics", () => {
  const fake = { document: createFakeDocument() };
  const env = {
    anchor: new FakeNode(),
    body: new FakeNode(),
    inside: new FakeNode(),
    outside: new FakeNode(),
  };

  beforeEach(() => {
    fake.document = createFakeDocument();
    env.inside = new FakeNode();
    env.anchor = new FakeNode();
    env.body = new FakeNode([env.inside]);
    env.outside = new FakeNode();
    (globalThis as { document?: unknown }).document = fake.document;
    (globalThis as { window?: unknown }).window = {};
    (globalThis as { Node?: unknown }).Node = FakeNode;
  });
  afterEach(() => {
    (globalThis as { document?: unknown }).document = undefined;
    (globalThis as { window?: unknown }).window = undefined;
    (globalThis as { Node?: unknown }).Node = undefined;
  });

  function mountController(overrides: { dismissOnEscape?: boolean } = {}) {
    const calls = { dismiss: 0 };
    const controller = createVizelPopoverController({
      getAnchor: () => env.anchor as unknown as HTMLElement,
      getBody: () => env.body as unknown as HTMLElement,
      onDismiss: () => calls.dismiss++,
      ...overrides,
    });
    controller.mount();
    return { controller, calls };
  }

  it("does not dismiss on a pointer event inside the body", () => {
    const { calls } = mountController();
    fake.document.dispatch("pointerdown", { target: env.inside });
    assert.equal(calls.dismiss, 0);
  });

  it("does not dismiss on a pointer event inside the anchor (trigger)", () => {
    const { calls } = mountController();
    // Clicking the trigger toggles the popover; the controller must
    // exclude the anchor from "outside" so the toggle does not also
    // register as an outside dismiss.
    fake.document.dispatch("pointerdown", { target: env.anchor });
    assert.equal(calls.dismiss, 0);
  });

  it("dismisses on a pointer event outside both the anchor and body", () => {
    const { calls } = mountController();
    fake.document.dispatch("pointerdown", { target: env.outside });
    assert.equal(calls.dismiss, 1);
  });

  it("dismisses on Escape by default", () => {
    const { calls } = mountController();
    fake.document.dispatch("keydown", { key: "Escape" });
    assert.equal(calls.dismiss, 1);
  });

  it("does not dismiss on Escape when dismissOnEscape is false", () => {
    const { calls } = mountController({ dismissOnEscape: false });
    fake.document.dispatch("keydown", { key: "Escape" });
    assert.equal(calls.dismiss, 0);
  });

  it("detaches every listener on unmount and tolerates repeat calls", () => {
    const { controller } = mountController();
    controller.unmount();
    controller.unmount();
    assert.equal(fake.document.registrations.length, 0);
  });

  it("is a no-op on mount when the body is missing", () => {
    const calls = { dismiss: 0 };
    const controller = createVizelPopoverController({
      getAnchor: () => env.anchor as unknown as HTMLElement,
      getBody: () => null,
      onDismiss: () => calls.dismiss++,
    });
    controller.mount();
    assert.equal(fake.document.registrations.length, 0);
  });
});
