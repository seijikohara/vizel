import { createVizelDismissibleController } from "./dismissibleController.ts";

/**
 * Side of the anchor the body prefers to sit on. The controller falls
 * back to the opposite side when the preferred side would overflow the
 * viewport.
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
 * explicitly after layout-affecting changes that the window listeners
 * miss (e.g. the body's content changing height).
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
 * The controller composes three concerns under one `{ mount, unmount }`
 * lifecycle:
 *
 * 1. **Positioning.** On `mount()` and whenever the window resizes or
 *    scrolls (configurable), the body is positioned against the anchor
 *    using the chosen placement, with viewport-edge fallback when the
 *    preferred side would overflow.
 * 2. **Outside-click dismissal.** A click whose target is contained
 *    neither in the anchor nor in the body invokes `onDismiss`.
 * 3. **Escape dismissal.** Pressing Escape invokes `onDismiss`.
 *
 * Items 2 and 3 use {@link createVizelDismissibleController} under the
 * hood, so the dismissal behavior matches the rest of the library.
 * Positioning writes `top` and `left` inline styles on the body
 * element.
 *
 * Server-Side Rendering (SSR) safe: every method short-circuits when
 * `document` is unavailable.
 */
export function createVizelPopoverController(
  options: VizelPopoverControllerOptions
): VizelPopoverController {
  const {
    getAnchor,
    getBody,
    placement = "bottom-start",
    offset = 4,
    onDismiss,
    dismissOnEscape = true,
    repositionOnWindowEvents = true,
  } = options;

  const dismissible = createVizelDismissibleController({
    getElements: () => [getAnchor(), getBody()],
    onDismiss,
    dismissOnEscape,
  });

  const updatePosition = (): void => {
    if (typeof window === "undefined") return;
    const anchor = getAnchor();
    const body = getBody();
    if (!(anchor && body)) return;

    const anchorRect = anchor.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    let top = 0;
    let left = 0;

    switch (placement) {
      case "bottom-start":
        top = anchorRect.bottom + offset;
        left = anchorRect.left;
        if (top + bodyRect.height > viewport.height) {
          top = anchorRect.top - bodyRect.height - offset;
        }
        break;
      case "bottom-end":
        top = anchorRect.bottom + offset;
        left = anchorRect.right - bodyRect.width;
        if (top + bodyRect.height > viewport.height) {
          top = anchorRect.top - bodyRect.height - offset;
        }
        break;
      case "top-start":
        top = anchorRect.top - bodyRect.height - offset;
        left = anchorRect.left;
        if (top < 0) {
          top = anchorRect.bottom + offset;
        }
        break;
      case "top-end":
        top = anchorRect.top - bodyRect.height - offset;
        left = anchorRect.right - bodyRect.width;
        if (top < 0) {
          top = anchorRect.bottom + offset;
        }
        break;
      case "right-start":
        top = anchorRect.top;
        left = anchorRect.right + offset;
        if (left + bodyRect.width > viewport.width) {
          left = anchorRect.left - bodyRect.width - offset;
        }
        break;
      case "left-start":
        top = anchorRect.top;
        left = anchorRect.left - bodyRect.width - offset;
        if (left < 0) {
          left = anchorRect.right + offset;
        }
        break;
    }

    // Clamp horizontally inside the viewport (vertical handled above).
    left = Math.max(0, Math.min(left, viewport.width - bodyRect.width));

    body.style.position = "fixed";
    body.style.top = `${top}px`;
    body.style.left = `${left}px`;
  };

  const handleReposition = (): void => {
    updatePosition();
  };

  let isMounted = false;

  return {
    mount: (): void => {
      if (typeof document === "undefined") return;
      if (isMounted) return;
      dismissible.mount();
      updatePosition();
      if (repositionOnWindowEvents) {
        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);
      }
      isMounted = true;
    },
    unmount: (): void => {
      if (typeof document === "undefined") return;
      if (!isMounted) return;
      dismissible.unmount();
      if (repositionOnWindowEvents) {
        window.removeEventListener("resize", handleReposition);
        window.removeEventListener("scroll", handleReposition, true);
      }
      isMounted = false;
    },
    updatePosition,
  };
}
