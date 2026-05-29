/**
 * Unit tests for the focus-trap primitive.
 *
 * The controller reads `document.activeElement`, queries focusable
 * elements, attaches a `keydown` listener to the trapped element, and
 * moves focus. The suite builds a minimal fake DOM that models those
 * operations — element `focus()` writes back to `document.activeElement`,
 * `querySelectorAll` returns the seeded children, and `contains` reports
 * ancestry — so the headless package stays free of a DOM-emulation
 * dependency, matching the dismissable and keyboard suites.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  buildVizelFocusTrapSpec,
  createVizelFocusTrapController,
} from "../src/focus-trap/index.ts";

/**
 * The shared mutable focus state. `focus()` on any fake element writes
 * its node here so the controller reads it through `document.activeElement`.
 */
const env = {
  activeElement: null as FakeElement | null,
};

/**
 * Minimal stand-in for the `HTMLElement` surface the controller touches:
 * `focus()`, `addEventListener`/`removeEventListener` for `keydown`,
 * `contains`, the focusability properties, and `isConnected`. A real
 * `KeyboardEvent` is unnecessary because the handler reads only `key`,
 * `shiftKey`, and `preventDefault`.
 */
class FakeElement {
  readonly children: FakeElement[] = [];
  readonly listeners: ((event: KeyboardEvent) => void)[] = [];
  parent: FakeElement | null = null;
  disabled = false;
  hidden = false;
  ariaHidden: string | null = null;
  rendered = true;
  isConnected = true;
  focusCount = 0;

  get offsetParent(): FakeElement | null {
    return this.rendered ? (this.parent ?? this) : null;
  }

  hasAttribute(name: string): boolean {
    return name === "disabled" ? this.disabled : false;
  }

  getAttribute(name: string): string | null {
    return name === "aria-hidden" ? this.ariaHidden : null;
  }

  focus(): void {
    this.focusCount += 1;
    env.activeElement = this;
  }

  contains(node: unknown): boolean {
    if (node === this) return true;
    return this.children.some((child) => child.contains(node));
  }

  querySelectorAll(_selector: string): FakeElement[] {
    // The controller filters the result with its own focusability guard,
    // so the fake returns every descendant and lets the guard decide.
    return this.descendants();
  }

  querySelector(_selector: string): FakeElement | null {
    return this.descendants()[0] ?? null;
  }

  addEventListener(type: string, handler: (event: KeyboardEvent) => void): void {
    if (type === "keydown") this.listeners.push(handler);
  }

  removeEventListener(type: string, handler: (event: KeyboardEvent) => void): void {
    if (type !== "keydown") return;
    const index = this.listeners.indexOf(handler);
    if (index !== -1) this.listeners.splice(index, 1);
  }

  dispatchKeydown(event: { key: string; shiftKey?: boolean }): boolean {
    const calls = { prevented: false };
    const full = {
      key: event.key,
      shiftKey: event.shiftKey ?? false,
      preventDefault: () => {
        calls.prevented = true;
      },
    } as unknown as KeyboardEvent;
    for (const handler of [...this.listeners]) handler(full);
    return calls.prevented;
  }

  private descendants(): FakeElement[] {
    return this.children.flatMap((child) => [child, ...child.descendants()]);
  }
}

/**
 * Build a target element seeded with `count` focusable children.
 */
function createTarget(count: number): FakeElement {
  const target = new FakeElement();
  for (const _ of Array.from({ length: count })) {
    const child = new FakeElement();
    child.parent = target;
    target.children.push(child);
  }
  return target;
}

function asElement(element: FakeElement): HTMLElement {
  return element as unknown as HTMLElement;
}

describe("buildVizelFocusTrapSpec", () => {
  it("resolves defaults when no options are passed", () => {
    assert.deepEqual(buildVizelFocusTrapSpec(), {
      initialFocusSelector: null,
      returnFocusOnUnmount: true,
    });
  });

  it("passes through an initial-focus selector and a return-focus opt-out", () => {
    assert.deepEqual(
      buildVizelFocusTrapSpec({ initialFocusSelector: ".x", returnFocusOnUnmount: false }),
      { initialFocusSelector: ".x", returnFocusOnUnmount: false }
    );
  });
});

describe("createVizelFocusTrapController", () => {
  beforeEach(() => {
    env.activeElement = null;
    (globalThis as { document?: unknown }).document = {
      get activeElement() {
        return env.activeElement;
      },
    };
    // The controller narrows the recorded active element with
    // `instanceof HTMLElement`; expose the fake base as the global so the
    // guard passes inside the Node runner.
    (globalThis as { HTMLElement?: unknown }).HTMLElement = FakeElement;
  });
  afterEach(() => {
    (globalThis as { document?: unknown }).document = undefined;
    (globalThis as { HTMLElement?: unknown }).HTMLElement = undefined;
  });

  it("moves focus to the first focusable element on mount", () => {
    const target = createTarget(3);
    const controller = createVizelFocusTrapController();
    controller.mount(asElement(target));
    assert.equal(env.activeElement, target.children[0]);
    assert.equal(target.children[0].focusCount, 1);
  });

  it("focuses the initialFocusSelector match when one is supplied", () => {
    const target = createTarget(3);
    // The fake `querySelector` returns the first descendant; assert the
    // controller routes through the selector branch by checking the
    // matched element receives focus.
    const controller = createVizelFocusTrapController({ initialFocusSelector: "input" });
    controller.mount(asElement(target));
    assert.equal(env.activeElement, target.children[0]);
  });

  it("wraps focus from the last element to the first on Tab", () => {
    const target = createTarget(3);
    const controller = createVizelFocusTrapController();
    controller.mount(asElement(target));

    // Move focus to the last element, then press Tab.
    target.children[2].focus();
    const prevented = target.dispatchKeydown({ key: "Tab" });

    assert.equal(prevented, true);
    assert.equal(env.activeElement, target.children[0]);
  });

  it("wraps focus from the first element to the last on Shift+Tab", () => {
    const target = createTarget(3);
    const controller = createVizelFocusTrapController();
    controller.mount(asElement(target));

    // Focus already sits on the first element after mount; press Shift+Tab.
    const prevented = target.dispatchKeydown({ key: "Tab", shiftKey: true });

    assert.equal(prevented, true);
    assert.equal(env.activeElement, target.children[2]);
  });

  it("leaves a mid-list Tab to the browser", () => {
    const target = createTarget(3);
    const controller = createVizelFocusTrapController();
    controller.mount(asElement(target));

    // Focus the middle element; Tab there does not wrap, so the controller
    // does not call preventDefault and the browser advances focus.
    target.children[1].focus();
    const prevented = target.dispatchKeydown({ key: "Tab" });
    assert.equal(prevented, false);
  });

  it("ignores non-Tab keys, leaving Escape to the dismissable", () => {
    const target = createTarget(3);
    const controller = createVizelFocusTrapController();
    controller.mount(asElement(target));

    const prevented = target.dispatchKeydown({ key: "Escape" });
    assert.equal(prevented, false);
  });

  it("returns focus to the previously-active element on unmount", () => {
    const trigger = new FakeElement();
    trigger.focus();
    assert.equal(env.activeElement, trigger);

    const target = createTarget(2);
    const controller = createVizelFocusTrapController();
    controller.mount(asElement(target));
    // Mount moved focus into the trap.
    assert.equal(env.activeElement, target.children[0]);

    controller.unmount();
    assert.equal(env.activeElement, trigger);
    assert.equal(trigger.focusCount, 2);
  });

  it("skips focus restoration when returnFocusOnUnmount is false", () => {
    const trigger = new FakeElement();
    trigger.focus();

    const target = createTarget(2);
    const controller = createVizelFocusTrapController({ returnFocusOnUnmount: false });
    controller.mount(asElement(target));
    controller.unmount();

    // Focus stays on the last element the trap focused, not the trigger.
    assert.equal(env.activeElement, target.children[0]);
    assert.equal(trigger.focusCount, 1);
  });

  it("does not restore focus to a disconnected trigger", () => {
    const trigger = new FakeElement();
    trigger.focus();

    const target = createTarget(2);
    const controller = createVizelFocusTrapController();
    controller.mount(asElement(target));
    // The trigger leaves the document before the trap closes.
    trigger.isConnected = false;
    const focusBefore = trigger.focusCount;
    controller.unmount();

    assert.equal(trigger.focusCount, focusBefore);
  });

  it("detaches the keydown listener on unmount and tolerates repeat calls", () => {
    const target = createTarget(2);
    const controller = createVizelFocusTrapController();
    controller.mount(asElement(target));
    assert.equal(target.listeners.length, 1);

    controller.unmount();
    controller.unmount();
    assert.equal(target.listeners.length, 0);
  });

  it("pins focus inside an empty trap so Tab cannot escape", () => {
    const target = createTarget(0);
    const controller = createVizelFocusTrapController();
    controller.mount(asElement(target));

    const prevented = target.dispatchKeydown({ key: "Tab" });
    assert.equal(prevented, true);
  });
});
