/**
 * Unit tests for the floating positioning primitive.
 *
 * The pure-spec suite asserts the placement and offset defaults without a
 * DOM. The controller suite mocks `@floating-ui/dom` so the test observes
 * the controller's behaviour — the inline styles it writes and the
 * `autoUpdate` subscription it manages — without depending on real layout
 * geometry.
 */

import assert from "node:assert/strict";

import { afterEach, beforeEach, describe, it, vi } from "vitest";

// Type-only import is erased at compile time, so it does not load the
// module before `vi.mock` registers the `@floating-ui/dom` stub.
import type { VizelVirtualElement } from "../src/floating/index.ts";

interface FloatingMockState {
  readonly computeCalls: { anchor: unknown; body: unknown; config: unknown }[];
  readonly autoUpdateCalls: { anchor: unknown; body: unknown; update: () => void }[];
  position: { x: number; y: number };
  autoUpdateDisposed: number;
}

// `vi.mock` hoists above this file's imports, so its factory cannot close
// over an ordinary top-level `const` (Vitest throws a "cannot access
// before initialization" style error). `vi.hoisted` runs its callback at
// that same hoisted position and returns a reference the factory can
// capture safely.
const floatingMock: FloatingMockState = vi.hoisted(() => ({
  computeCalls: [],
  autoUpdateCalls: [],
  position: { x: 12, y: 34 },
  autoUpdateDisposed: 0,
}));

// Mock `@floating-ui/dom` before the module under test imports it. The
// stub resolves `computePosition` synchronously-as-Promise and records
// the `autoUpdate` subscription so the controller's lifecycle is
// observable without real DOM measurement.
vi.mock("@floating-ui/dom", () => ({
  computePosition: (anchor: unknown, body: unknown, config: unknown) => {
    floatingMock.computeCalls.push({ anchor, body, config });
    return Promise.resolve({ x: floatingMock.position.x, y: floatingMock.position.y });
  },
  autoUpdate: (anchor: unknown, body: unknown, update: () => void) => {
    floatingMock.autoUpdateCalls.push({ anchor, body, update });
    return () => {
      floatingMock.autoUpdateDisposed += 1;
    };
  },
  offset: (value: unknown) => ({ name: "offset", value }),
  flip: () => ({ name: "flip" }),
  shift: (value: unknown) => ({ name: "shift", value }),
}));

const { buildVizelFloatingSpec, createVizelFloatingController } =
  await import("../src/floating/index.ts");

interface FakeElement {
  style: Record<string, string>;
}

function createFakeElement(): FakeElement {
  return { style: {} };
}

describe("buildVizelFloatingSpec", () => {
  it("applies the placement and offset defaults", () => {
    assert.deepEqual(buildVizelFloatingSpec(), { placement: "bottom-start", offset: 4 });
  });

  it("keeps caller-supplied placement and offset", () => {
    assert.deepEqual(buildVizelFloatingSpec({ placement: "top-end", offset: 10 }), {
      placement: "top-end",
      offset: 10,
    });
  });
});

describe("createVizelFloatingController", () => {
  const env = { anchor: createFakeElement(), body: createFakeElement() };

  beforeEach(() => {
    floatingMock.computeCalls.length = 0;
    floatingMock.autoUpdateCalls.length = 0;
    floatingMock.autoUpdateDisposed = 0;
    floatingMock.position = { x: 12, y: 34 };
    env.anchor = createFakeElement();
    env.body = createFakeElement();
    (globalThis as { window?: unknown }).window = {};
    (globalThis as { document?: unknown }).document = {};
  });
  afterEach(() => {
    (globalThis as { window?: unknown }).window = undefined;
    (globalThis as { document?: unknown }).document = undefined;
  });

  it("writes fixed position styles on the body after mount", async () => {
    const controller = createVizelFloatingController({
      getAnchor: () => env.anchor as unknown as HTMLElement,
      getBody: () => env.body as unknown as HTMLElement,
    });
    controller.mount();
    // `computePosition` resolves on a microtask; await it before asserting.
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(env.body.style.position, "fixed");
    assert.equal(env.body.style.left, "12px");
    assert.equal(env.body.style.top, "34px");
  });

  it("subscribes to autoUpdate on mount and disposes on unmount", () => {
    const controller = createVizelFloatingController({
      getAnchor: () => env.anchor as unknown as HTMLElement,
      getBody: () => env.body as unknown as HTMLElement,
    });
    controller.mount();
    assert.equal(floatingMock.autoUpdateCalls.length, 1);

    controller.unmount();
    assert.equal(floatingMock.autoUpdateDisposed, 1);
  });

  it("skips the autoUpdate subscription when repositionOnWindowEvents is false", () => {
    const controller = createVizelFloatingController({
      getAnchor: () => env.anchor as unknown as HTMLElement,
      getBody: () => env.body as unknown as HTMLElement,
      repositionOnWindowEvents: false,
    });
    controller.mount();
    assert.equal(floatingMock.autoUpdateCalls.length, 0);
    // Positioning still runs once on mount even without the subscription.
    assert.equal(floatingMock.computeCalls.length, 1);
  });

  it("forwards the resolved offset to the offset middleware", () => {
    const controller = createVizelFloatingController({
      getAnchor: () => env.anchor as unknown as HTMLElement,
      getBody: () => env.body as unknown as HTMLElement,
      offset: 16,
    });
    controller.mount();
    const config = floatingMock.computeCalls[0]?.config as {
      middleware: { name: string; value?: unknown }[];
      placement: string;
    };
    const offsetMiddleware = config.middleware.find((entry) => entry.name === "offset");
    assert.equal(offsetMiddleware?.value, 16);
    assert.equal(config.placement, "bottom-start");
  });

  it("is a no-op when window is undefined (SSR guard)", () => {
    (globalThis as { window?: unknown }).window = undefined;
    const controller = createVizelFloatingController({
      getAnchor: () => env.anchor as unknown as HTMLElement,
      getBody: () => env.body as unknown as HTMLElement,
    });
    controller.mount();
    assert.equal(floatingMock.computeCalls.length, 0);
    assert.equal(floatingMock.autoUpdateCalls.length, 0);
  });

  it("positions against a virtual anchor that exposes only getBoundingClientRect", async () => {
    // The block menu captures the drag-handle rect, not a stable element,
    // so it supplies a virtual anchor. `getAnchor` accepts the virtual
    // element without a cast, and the controller forwards it to
    // `computePosition` so the body still receives fixed-position styles.
    const rect = { left: 5, top: 7, bottom: 9, right: 11, width: 6, height: 2 } as DOMRect;
    const virtualAnchor: VizelVirtualElement = { getBoundingClientRect: () => rect };
    const controller = createVizelFloatingController({
      getAnchor: () => virtualAnchor,
      getBody: () => env.body as unknown as HTMLElement,
    });
    controller.mount();
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(floatingMock.computeCalls[0]?.anchor, virtualAnchor);
    assert.equal(floatingMock.autoUpdateCalls[0]?.anchor, virtualAnchor);
    assert.equal(env.body.style.position, "fixed");
    assert.equal(env.body.style.left, "12px");
    assert.equal(env.body.style.top, "34px");
  });
});
