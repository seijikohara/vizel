import {
  createVizelPopoverController as createVizelHeadlessPopoverController,
  type VizelPopoverController as VizelHeadlessPopoverController,
} from "@vizel/headless/popover";

/**
 * Side the body prefers to sit on relative to the anchor.
 *
 * The controller falls back to the opposite side when the preferred side
 * would overflow the viewport. The values are a subset of
 * `@floating-ui/dom`'s `Placement` union — the placements Vizel surfaces
 * actually request. ADR-0003 names `@floating-ui/dom` as the positioning
 * engine; the wrapper restricts the union so existing core call sites
 * keep their narrow type.
 */
export type VizelPopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "right-start"
  | "left-start";

/**
 * Options for {@link createVizelPopoverController}.
 */
export interface VizelPopoverControllerOptions {
  /** Returns the anchor element the body positions against. */
  getAnchor: () => HTMLElement | null;
  /** Returns the floating body element to position. */
  getBody: () => HTMLElement | null;
  /** Preferred placement; defaults to `"bottom-start"`. */
  placement?: VizelPopoverPlacement;
  /** Pixel offset between the anchor and the body. Defaults to 4. */
  offset?: number;
  /** Called when the controller decides the popover should close. */
  onDismiss: () => void;
  /** Whether Escape dismisses (default: true). */
  dismissOnEscape?: boolean;
  /**
   * Whether `window` `resize` and `scroll` events trigger a reposition.
   * Defaults to true. Set to false for popovers anchored to fixed
   * elements that do not move.
   */
  repositionOnWindowEvents?: boolean;
}

/**
 * Returned by {@link createVizelPopoverController}.
 *
 * Combines positioning and dismissal under one mount/unmount lifecycle.
 * `updatePosition()` is exposed so callers can trigger a reposition
 * explicitly after layout-affecting changes that the reposition
 * subscription misses (for example the body's content changing height).
 */
export interface VizelPopoverController {
  /** Activate listeners and place the body. */
  readonly mount: () => void;
  /** Detach listeners. Idempotent. */
  readonly unmount: () => void;
  /** Recompute and apply the body's position against the anchor. */
  readonly updatePosition: () => void;
}

/**
 * Build a controller for an anchored popover.
 *
 * The controller delegates to `@vizel/headless`'s popover primitive,
 * which composes `@floating-ui/dom` positioning with the dismissable
 * listener wiring. The wrapper exists so existing `@vizel/core` call
 * sites keep importing `createVizelPopoverController` from Core; ADR-0003
 * moves the implementation into the headless package, and the headless
 * popover de-duplicates the dismiss logic that previously lived in a
 * separate Core controller.
 *
 * The controller composes two concerns under one `{ mount, unmount }`
 * lifecycle:
 *
 * 1. **Positioning.** On `mount()` and whenever the window resizes or
 *    scrolls (configurable), the body positions against the anchor with
 *    viewport-edge fallback when the preferred side would overflow.
 * 2. **Dismissal.** A pointer event whose target is contained neither in
 *    the anchor nor in the body invokes `onDismiss`. Escape invokes
 *    `onDismiss` when `dismissOnEscape` stays enabled.
 *
 * Server-Side Rendering (SSR) safe: every method short-circuits when
 * `document` is unavailable.
 */
export function createVizelPopoverController(
  options: VizelPopoverControllerOptions
): VizelPopoverController {
  const controller: VizelHeadlessPopoverController = createVizelHeadlessPopoverController({
    getAnchor: options.getAnchor,
    getBody: options.getBody,
    onDismiss: options.onDismiss,
    ...(options.placement === undefined ? {} : { placement: options.placement }),
    ...(options.offset === undefined ? {} : { offset: options.offset }),
    ...(options.dismissOnEscape === undefined ? {} : { dismissOnEscape: options.dismissOnEscape }),
    ...(options.repositionOnWindowEvents === undefined
      ? {}
      : { repositionOnWindowEvents: options.repositionOnWindowEvents }),
  });
  return {
    mount: controller.mount,
    unmount: controller.unmount,
    updatePosition: controller.updatePosition,
  };
}
