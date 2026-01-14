import type { CustomIconMap, VizelIconContextValue } from "@vizel/core";
import { getContext, setContext } from "svelte";

const VIZEL_ICON_CONTEXT_KEY = Symbol("vizel-icon-context");

/**
 * Set custom icon mappings for child components.
 * Call this in a parent component to customize icons for all descendants.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { setVizelIcons } from "@vizel/svelte";
 *
 *   // Use Phosphor icons
 *   setVizelIcons({
 *     heading1: "ph:text-h-one",
 *     heading2: "ph:text-h-two",
 *     bold: "ph:text-b-bold",
 *     italic: "ph:text-italic",
 *   });
 * </script>
 * ```
 */
export function setVizelIcons(customIcons?: CustomIconMap): void {
  setContext(VIZEL_ICON_CONTEXT_KEY, { customIcons } satisfies VizelIconContextValue);
}

/**
 * Get custom icon mappings from parent context.
 * Returns an empty object if no context is set.
 */
export function getVizelIconContext(): VizelIconContextValue {
  return getContext<VizelIconContextValue>(VIZEL_ICON_CONTEXT_KEY) ?? {};
}
