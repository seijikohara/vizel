/**
 * Utilities for managing suggestion popup containers (e.g., slash menu).
 * These helpers provide consistent positioning and lifecycle management
 * across all framework implementations.
 */

/**
 * A function that returns a DOMRect or null.
 * Used by Tiptap's suggestion system for positioning.
 */
export type VizelDOMRectGetter = (() => DOMRect | null) | null | undefined;

/**
 * A managed suggestion container with positioning support.
 */
export interface VizelSuggestionContainer {
  /** The outer container element appended to document.body */
  container: HTMLDivElement;
  /** The inner container for mounting framework components */
  menuContainer: HTMLDivElement;
  /** Update the container position based on the cursor/selection rect */
  updatePosition: (clientRect: VizelDOMRectGetter) => void;
  /** Remove the container from the DOM */
  destroy: () => void;
}

/**
 * Default z-index for suggestion containers.
 */
export const VIZEL_SUGGESTION_Z_INDEX = "50";

/**
 * Create a positioned container for suggestion popups.
 *
 * This creates a container element that is:
 * - Positioned absolutely in the document
 * - Contains an inner element for mounting framework components
 * - Provides a method to update position based on cursor location
 *
 * @returns A managed suggestion container
 *
 * @example
 * ```typescript
 * // In a slash menu renderer:
 * const { container, menuContainer, updatePosition, destroy } =
 *   createVizelSuggestionContainer();
 *
 * // Mount your framework component to menuContainer
 * ReactDOM.createRoot(menuContainer).render(<SlashMenu />);
 *
 * // Update position when Tiptap provides new coordinates
 * updatePosition(props.clientRect);
 *
 * // Clean up when done
 * destroy();
 * ```
 */
export function createVizelSuggestionContainer(): VizelSuggestionContainer {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.zIndex = VIZEL_SUGGESTION_Z_INDEX;
  document.body.appendChild(container);

  const menuContainer = document.createElement("div");
  container.appendChild(menuContainer);

  const updatePosition = (clientRect: VizelDOMRectGetter): void => {
    if (!clientRect) return;
    const rect = clientRect();
    if (!rect) return;
    container.style.top = `${rect.bottom + window.scrollY}px`;
    container.style.left = `${rect.left + window.scrollX}px`;
  };

  const destroy = (): void => {
    container.remove();
  };

  return {
    container,
    menuContainer,
    updatePosition,
    destroy,
  };
}

/**
 * Handle the Escape key for suggestion popups.
 *
 * Returns true if the event was an Escape key press, indicating
 * that the suggestion should be dismissed.
 *
 * @param event - The keyboard event to check
 * @returns true if this was an Escape key press
 *
 * @example
 * ```typescript
 * onKeyDown: ({ event }) => {
 *   if (handleVizelSuggestionEscape(event)) {
 *     return true; // Tell Tiptap we handled it
 *   }
 *   // Handle other keys...
 * }
 * ```
 */
export function handleVizelSuggestionEscape(event: KeyboardEvent): boolean {
  return event.key === "Escape";
}
