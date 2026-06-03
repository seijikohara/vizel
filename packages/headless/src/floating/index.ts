/**
 * Floating positioning primitive.
 *
 * Wraps `@floating-ui/dom` so every Vizel popover, dropdown, and menu
 * anchors its body element against a trigger with consistent flip and
 * shift behaviour. The module ships one pure spec builder and one
 * controller. ADR-0003 (headless package) records why the positioning
 * logic lives in `@vizel/headless` rather than each adapter, and names
 * `@floating-ui/dom` as the positioning engine; ADR-0007 (controller
 * delegation) records why the DOM-touching variant follows the
 * `{ mount, unmount, update }` contract.
 *
 * `buildVizelFloatingSpec` is pure: it merges caller options with the
 * placement and offset defaults and returns the resolved spec, so a test
 * or a server render can read the configuration without a DOM.
 * `createVizelFloatingController` owns the `computePosition` call and the
 * `autoUpdate` subscription that repositions the body when the anchor
 * moves.
 */

import { autoUpdate, computePosition, flip, offset, type Placement, shift } from "@floating-ui/dom";

/**
 * A virtual anchor for the floating engine.
 *
 * `@floating-ui/dom`'s `computePosition` positions a body against any
 * object exposing `getBoundingClientRect`, not only a live DOM element
 * (see https://floating-ui.com/docs/virtual-elements). A surface that
 * captures a rect — for example the block menu, which receives the
 * drag-handle's `DOMRect` through a custom event rather than a stable
 * element reference — supplies a `VizelVirtualElement` so the body still
 * positions, flips, and shifts against the captured geometry.
 */
export interface VizelVirtualElement {
  /** Return the rectangle the body positions against. */
  readonly getBoundingClientRect: () => DOMRect;
}

/**
 * The anchor a floating body positions against: a live element or a
 * virtual element carrying only a `getBoundingClientRect`.
 */
export type VizelFloatingAnchor = HTMLElement | VizelVirtualElement;

/**
 * Default placement applied when the caller omits `placement`. Vizel
 * surfaces open below the trigger and left-align by convention.
 */
export const VIZEL_FLOATING_DEFAULT_PLACEMENT = "bottom-start" satisfies Placement;

/**
 * Default gap, in pixels, between the anchor and the body. The value
 * keeps anchored surfaces visually attached to their trigger.
 */
export const VIZEL_FLOATING_DEFAULT_OFFSET = 4;

/**
 * Options for {@link buildVizelFloatingSpec}.
 */
export interface VizelFloatingSpecOptions {
  /** Preferred placement; defaults to `"bottom-start"`. */
  readonly placement?: Placement;
  /** Pixel gap between the anchor and the body; defaults to 4. */
  readonly offset?: number;
}

/**
 * Resolved floating configuration returned by
 * {@link buildVizelFloatingSpec}.
 *
 * The spec carries the fully-resolved placement and offset so the
 * controller and any test read the same defaults from one source.
 */
export interface VizelFloatingSpec {
  /** Resolved placement after applying defaults. */
  readonly placement: Placement;
  /** Resolved offset in pixels after applying defaults. */
  readonly offset: number;
}

/**
 * Return the resolved floating spec for the supplied options.
 *
 * The function is pure and Server-Side Rendering (SSR) safe: it reads no
 * DOM and applies the placement and offset defaults to the caller's
 * options.
 *
 * @example
 * ```ts
 * const spec = buildVizelFloatingSpec({ placement: "top-end" });
 * // spec === { placement: "top-end", offset: 4 }
 * ```
 */
export function buildVizelFloatingSpec(options: VizelFloatingSpecOptions = {}): VizelFloatingSpec {
  return {
    placement: options.placement ?? VIZEL_FLOATING_DEFAULT_PLACEMENT,
    offset: options.offset ?? VIZEL_FLOATING_DEFAULT_OFFSET,
  };
}

/**
 * Options for {@link createVizelFloatingController}.
 */
export interface VizelFloatingControllerOptions extends VizelFloatingSpecOptions {
  /**
   * Return the anchor the body positions against, or `null`. The anchor
   * is a live element or a {@link VizelVirtualElement} that exposes only
   * `getBoundingClientRect`.
   */
  readonly getAnchor: () => VizelFloatingAnchor | null;
  /** Return the floating body element to position, or `null`. */
  readonly getBody: () => HTMLElement | null;
  /**
   * When `true`, reposition the body on every relevant `window` `resize`
   * and `scroll` event via `@floating-ui/dom`'s `autoUpdate`. Set to
   * `false` for a body anchored to an element that never moves. Defaults
   * to `true`.
   */
  readonly repositionOnWindowEvents?: boolean;
}

/**
 * Returned by {@link createVizelFloatingController}.
 *
 * The controller follows the canonical `{ mount, unmount, update }`
 * contract. `mount` positions the body and, when enabled, subscribes to
 * `autoUpdate`; `updatePosition` recomputes on demand after a
 * layout-affecting change the subscription cannot observe (for example
 * the body's own content changing height).
 */
export interface VizelFloatingController {
  /** Position the body and start the reposition subscription. */
  readonly mount: () => void;
  /** Stop the subscription. Calling `unmount` more than once is a no-op. */
  readonly unmount: () => void;
  /**
   * Replace the placement, offset, or reposition options. Re-positions
   * immediately and re-subscribes when the controller is mounted.
   */
  readonly update: (
    options: VizelFloatingSpecOptions & { repositionOnWindowEvents?: boolean }
  ) => void;
  /** Recompute and apply the body's position against the anchor. */
  readonly updatePosition: () => void;
}

const isBrowser = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

/**
 * Construct a controller that positions a floating body against an
 * anchor using `@floating-ui/dom`.
 *
 * The controller writes `position: fixed` plus the computed `top` and
 * `left` inline styles on the body element. The `flip` middleware moves
 * the body to the opposite side when the preferred placement overflows
 * the viewport; the `shift` middleware slides the body along the cross
 * axis to keep it on screen. Server-Side Rendering (SSR) safe: every
 * method short-circuits when `window` or `document` is unavailable.
 *
 * @example
 * ```ts
 * const controller = createVizelFloatingController({
 *   getAnchor: () => triggerRef.current,
 *   getBody: () => popoverRef.current,
 *   placement: "bottom-start",
 * });
 * controller.mount();
 * // teardown: controller.unmount();
 * ```
 */
export function createVizelFloatingController(
  options: VizelFloatingControllerOptions
): VizelFloatingController {
  const state = {
    spec: buildVizelFloatingSpec(options),
    repositionOnWindowEvents: options.repositionOnWindowEvents ?? true,
    cleanupAutoUpdate: null as (() => void) | null,
    isMounted: false,
  };

  const updatePosition = (): void => {
    if (!isBrowser()) return;
    const anchor = options.getAnchor();
    const body = options.getBody();
    if (!(anchor && body)) return;
    // `computePosition` resolves asynchronously; the body element may
    // unmount between the call and its resolution, so re-read it before
    // writing styles to avoid touching a detached node.
    void computePosition(anchor, body, {
      placement: state.spec.placement,
      strategy: "fixed",
      middleware: [offset(state.spec.offset), flip(), shift({ padding: 4 })],
    }).then(({ x, y }) => {
      const target = options.getBody();
      if (!target) return;
      target.style.position = "fixed";
      target.style.left = `${x}px`;
      target.style.top = `${y}px`;
    });
  };

  const stopAutoUpdate = (): void => {
    if (state.cleanupAutoUpdate !== null) {
      state.cleanupAutoUpdate();
      state.cleanupAutoUpdate = null;
    }
  };

  const startAutoUpdate = (): void => {
    if (!isBrowser()) return;
    if (!state.repositionOnWindowEvents) return;
    const anchor = options.getAnchor();
    const body = options.getBody();
    if (!(anchor && body)) return;
    stopAutoUpdate();
    // `autoUpdate` reattaches its own resize/scroll observers; it returns
    // the disposer the controller invokes on unmount.
    state.cleanupAutoUpdate = autoUpdate(anchor, body, updatePosition);
  };

  return {
    mount: (): void => {
      if (!isBrowser()) return;
      if (state.isMounted) return;
      updatePosition();
      startAutoUpdate();
      state.isMounted = true;
    },
    unmount: (): void => {
      stopAutoUpdate();
      state.isMounted = false;
    },
    update: (next): void => {
      state.spec = buildVizelFloatingSpec({
        placement: next.placement ?? state.spec.placement,
        offset: next.offset ?? state.spec.offset,
      });
      if (next.repositionOnWindowEvents !== undefined) {
        state.repositionOnWindowEvents = next.repositionOnWindowEvents;
      }
      if (!state.isMounted) return;
      updatePosition();
      startAutoUpdate();
    },
    updatePosition,
  };
}
