/**
 * Anchored popover primitive.
 *
 * Composes the {@link createVizelFloatingController} positioning engine
 * with the {@link createVizelDismissable} listener wiring under one
 * `{ mount, unmount, update }` lifecycle. Every Vizel surface that opens
 * a body element against a trigger — the block menu, the toolbar
 * dropdown, the node selector, and the color picker — shares this
 * controller. The composition lives in `@vizel/headless` so the three
 * adapters share one implementation, and the controller follows the
 * `{ mount, unmount, update }` lifecycle contract.
 *
 * `buildVizelPopoverPositionSpec` is pure and re-exports the floating
 * spec so a caller reads the resolved placement and offset without a
 * DOM. `createVizelPopoverController` owns the positioning subscription
 * and the dismiss listeners.
 *
 * Dismiss semantics: a pointer event inside the body or inside the
 * anchor does not dismiss; a pointer event truly outside both
 * dismisses; Escape dismisses when `dismissOnEscape` stays enabled.
 * The anchor exclusion is necessary
 * because the trigger lives outside the body element the dismissable
 * controller mounts, so clicking the trigger to toggle the popover must
 * not also register as an outside click.
 */

import { createVizelDismissable } from "../dismissable/index.ts";
import {
  buildVizelFloatingSpec,
  createVizelFloatingController,
  type VizelFloatingAnchor,
  type VizelFloatingSpec,
  type VizelFloatingSpecOptions,
} from "../floating/index.ts";

/**
 * Report whether the anchor exposes a DOM `contains` method.
 *
 * A live element answers `true`; a {@link VizelFloatingAnchor} virtual
 * element, which carries only `getBoundingClientRect`, answers `false`.
 * The guard reads the property without naming the `HTMLElement` global,
 * which is undefined under Server-Side Rendering (SSR) and in the Node
 * test runner.
 */
const hasContains = (anchor: VizelFloatingAnchor): anchor is HTMLElement =>
  typeof (anchor as { contains?: unknown }).contains === "function";

/**
 * Options for {@link buildVizelPopoverPositionSpec}.
 *
 * The popover spec is the floating spec; the alias keeps the popover
 * module self-contained so callers do not reach into `floating/`.
 */
export type VizelPopoverPositionSpecOptions = VizelFloatingSpecOptions;

/**
 * Resolved popover positioning spec; an alias of {@link VizelFloatingSpec}.
 */
export type VizelPopoverPositionSpec = VizelFloatingSpec;

/**
 * Return the resolved positioning spec for an anchored popover.
 *
 * The function is pure and Server-Side Rendering (SSR) safe; it delegates
 * to {@link buildVizelFloatingSpec} so the popover and the floating
 * primitive resolve identical placement and offset defaults.
 *
 * @example
 * ```ts
 * const spec = buildVizelPopoverPositionSpec({ placement: "top-start" });
 * // spec === { placement: "top-start", offset: 4 }
 * ```
 */
export function buildVizelPopoverPositionSpec(
  options: VizelPopoverPositionSpecOptions = {}
): VizelPopoverPositionSpec {
  return buildVizelFloatingSpec(options);
}

/**
 * Options for {@link createVizelPopoverController}.
 */
export interface VizelPopoverControllerOptions extends VizelFloatingSpecOptions {
  /**
   * Return the anchor the body positions against, or `null`. The anchor
   * is a live element or a {@link VizelFloatingAnchor} virtual element
   * carrying only `getBoundingClientRect`. A virtual anchor cannot
   * contain a pointer target, so the controller excludes it from
   * "outside" detection only when it exposes `contains`.
   */
  readonly getAnchor: () => VizelFloatingAnchor | null;
  /** Return the floating body element to position, or `null`. */
  readonly getBody: () => HTMLElement | null;
  /** Called when the controller decides the popover should close. */
  readonly onDismiss: () => void;
  /** Whether Escape dismisses the popover. Defaults to `true`. */
  readonly dismissOnEscape?: boolean;
  /**
   * When `true`, run the Escape handler in the capture phase and call
   * `stopImmediatePropagation()` so the editor's own Escape binding does
   * not also fire. Defaults to `false`.
   */
  readonly captureEscape?: boolean;
  /**
   * When `true`, reposition the body on relevant `window` `resize` and
   * `scroll` events. Defaults to `true`.
   */
  readonly repositionOnWindowEvents?: boolean;
}

/**
 * Returned by {@link createVizelPopoverController}.
 *
 * Combines positioning and dismissal under one mount/unmount lifecycle.
 * `updatePosition` recomputes the body's position on demand after a
 * layout change the reposition subscription cannot observe (for example
 * the body's own content changing height).
 */
export interface VizelPopoverController {
  /** Activate dismiss listeners and place the body. */
  readonly mount: () => void;
  /** Detach listeners and stop the subscription. Idempotent. */
  readonly unmount: () => void;
  /** Replace the placement, offset, or reposition options. */
  readonly update: (
    options: VizelFloatingSpecOptions & { repositionOnWindowEvents?: boolean }
  ) => void;
  /** Recompute and apply the body's position against the anchor. */
  readonly updatePosition: () => void;
}

/**
 * Construct a controller for an anchored popover.
 *
 * The controller composes two concerns under one `{ mount, unmount }`
 * lifecycle:
 *
 * 1. **Positioning.** {@link createVizelFloatingController} places the
 *    body against the anchor with `@floating-ui/dom`'s flip and shift
 *    middleware and repositions on `window` events.
 * 2. **Dismissal.** {@link createVizelDismissable} fires the dismiss
 *    callback on a pointer event outside the body or on Escape. The
 *    popover additionally excludes the anchor from "outside" so a click
 *    on the trigger that toggles the popover does not register as an
 *    outside click.
 *
 * Server-Side Rendering (SSR) safe: every method short-circuits when the
 * DOM is unavailable through the composed controllers.
 *
 * @example
 * ```ts
 * const controller = createVizelPopoverController({
 *   getAnchor: () => triggerRef.current,
 *   getBody: () => popoverRef.current,
 *   onDismiss: () => setOpen(false),
 * });
 * controller.mount();
 * // teardown: controller.unmount();
 * ```
 */
export function createVizelPopoverController(
  options: VizelPopoverControllerOptions
): VizelPopoverController {
  const floating = createVizelFloatingController({
    getAnchor: options.getAnchor,
    getBody: options.getBody,
    // `exactOptionalPropertyTypes` rejects an explicit `undefined` for an
    // optional property, so spread each optional only when the caller set
    // it; the floating controller applies its own defaults otherwise.
    ...(options.placement === undefined ? {} : { placement: options.placement }),
    ...(options.offset === undefined ? {} : { offset: options.offset }),
    ...(options.repositionOnWindowEvents === undefined
      ? {}
      : { repositionOnWindowEvents: options.repositionOnWindowEvents }),
  });

  const dismissable = createVizelDismissable({
    onPointerOutside: (target) => {
      // The dismissable controller already excluded the body. Exclude the
      // anchor too: the trigger lives outside the body, so toggling the
      // popover by clicking the trigger must not count as an outside
      // click. The "outside" set therefore spans both the anchor and the
      // body. A virtual anchor exposes only `getBoundingClientRect`, so
      // probe for `contains` rather than `instanceof HTMLElement`: the
      // global is undefined under SSR and in the Node test runner, and the
      // capability check covers both an element anchor and a virtual one.
      const anchor = options.getAnchor();
      if (
        target instanceof Node &&
        anchor !== null &&
        hasContains(anchor) &&
        anchor.contains(target)
      ) {
        return;
      }
      options.onDismiss();
    },
    ...(options.dismissOnEscape === false ? {} : { onEscape: () => options.onDismiss() }),
    ...(options.captureEscape === undefined ? {} : { captureEscape: options.captureEscape }),
  });

  const state = { isMounted: false };

  return {
    mount: (): void => {
      if (typeof document === "undefined") return;
      if (state.isMounted) return;
      const body = options.getBody();
      if (!body) return;
      dismissable.mount(body);
      floating.mount();
      state.isMounted = true;
    },
    unmount: (): void => {
      if (!state.isMounted) return;
      dismissable.unmount();
      floating.unmount();
      state.isMounted = false;
    },
    update: (next): void => {
      floating.update(next);
    },
    updatePosition: floating.updatePosition,
  };
}
