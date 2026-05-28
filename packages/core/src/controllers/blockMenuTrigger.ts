import { VIZEL_BLOCK_MENU_EVENT, type VizelBlockMenuOpenDetail } from "../extensions/block-menu.ts";

/**
 * Options for {@link createVizelBlockMenuTriggerController}.
 */
export interface VizelBlockMenuTriggerControllerOptions {
  /**
   * Fires when the drag-handle extension dispatches a block-menu open
   * request. The detail carries the editor instance, document position,
   * the target node, and the handle's bounding rect for positioning.
   */
  readonly onOpen: (detail: VizelBlockMenuOpenDetail) => void;
}

/**
 * Returned by {@link createVizelBlockMenuTriggerController}.
 *
 * Mirrors the canonical controller shape from ADR-0007 so framework
 * adapters never attach the custom-event listener themselves.
 */
export interface VizelBlockMenuTriggerController {
  /** Activate the document-level `VIZEL_BLOCK_MENU_EVENT` listener. */
  readonly mount: () => void;
  /** Detach the listener. Calling `unmount` more than once is a no-op. */
  readonly unmount: () => void;
  /** Replace the open callback without re-attaching the listener. */
  readonly update: (options: VizelBlockMenuTriggerControllerOptions) => void;
}

/**
 * Build a controller that subscribes to `VIZEL_BLOCK_MENU_EVENT`.
 *
 * The drag-handle extension dispatches the event on `document`; this
 * controller owns the subscription so adapter components never call
 * `document.addEventListener` directly. ADR-0007 forbids that direct
 * call in framework code.
 */
export function createVizelBlockMenuTriggerController(
  initialOptions: VizelBlockMenuTriggerControllerOptions
): VizelBlockMenuTriggerController {
  const state = {
    options: initialOptions,
    handler: null as ((event: Event) => void) | null,
  };

  return {
    mount: (): void => {
      // SSR guard: the listener target only exists in the browser.
      if (typeof document === "undefined") return;
      if (state.handler !== null) return;
      const handler = (event: Event): void => {
        if (!(event instanceof CustomEvent)) return;
        state.options.onOpen(event.detail as VizelBlockMenuOpenDetail);
      };
      state.handler = handler;
      document.addEventListener(VIZEL_BLOCK_MENU_EVENT, handler);
    },
    unmount: (): void => {
      if (typeof document === "undefined") return;
      if (state.handler === null) return;
      document.removeEventListener(VIZEL_BLOCK_MENU_EVENT, state.handler);
      state.handler = null;
    },
    update: (options: VizelBlockMenuTriggerControllerOptions): void => {
      state.options = options;
    },
  };
}
