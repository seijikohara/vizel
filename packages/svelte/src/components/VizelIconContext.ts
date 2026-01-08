import type { VizelIconName } from "@vizel/core";
import { getContext, setContext } from "svelte";

/**
 * Custom icon mappings to override default Iconify icon IDs.
 * Keys are semantic icon names, values are Iconify icon IDs.
 *
 * @example
 * ```ts
 * const customIcons: CustomIconMap = {
 *   heading1: "mdi:format-header-1",
 *   bold: "mdi:format-bold",
 *   // Use any Iconify icon set: Material Design, Heroicons, Phosphor, etc.
 * };
 * ```
 */
export type CustomIconMap = Partial<Record<VizelIconName, string>>;

export interface VizelIconContextValue {
  /**
   * Custom icon mappings that override default Lucide icons.
   */
  customIcons?: CustomIconMap | undefined;
}

const VIZEL_ICON_CONTEXT_KEY = Symbol("vizel-icon-context");

/**
 * Set custom icon mappings for child components.
 * Call this in a parent component to customize icons for all descendants.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { setVizelIconContext } from "@vizel/svelte";
 *
 *   // Use Phosphor icons
 *   setVizelIconContext({
 *     heading1: "ph:text-h-one",
 *     heading2: "ph:text-h-two",
 *     bold: "ph:text-b-bold",
 *     italic: "ph:text-italic",
 *   });
 * </script>
 * ```
 */
export function setVizelIconContext(customIcons?: CustomIconMap): void {
  setContext(VIZEL_ICON_CONTEXT_KEY, { customIcons } satisfies VizelIconContextValue);
}

/**
 * Get custom icon mappings from parent context.
 * Returns an empty object if no context is set.
 */
export function getVizelIconContext(): VizelIconContextValue {
  return getContext<VizelIconContextValue>(VIZEL_ICON_CONTEXT_KEY) ?? {};
}
