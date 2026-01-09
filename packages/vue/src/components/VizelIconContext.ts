import type { VizelIconName } from "@vizel/core";
import type { InjectionKey } from "vue";
import { inject, provide } from "vue";

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

/**
 * Injection key for icon context.
 */
export const VizelIconContextKey: InjectionKey<VizelIconContextValue> =
  Symbol("vizel-icon-context");

/**
 * Provide custom icon mappings to child components.
 * Call this in a parent component's setup to customize icons for all descendants.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { provideVizelIconContext } from "@vizel/vue";
 *
 * // Use Phosphor icons
 * provideVizelIconContext({
 *   heading1: "ph:text-h-one",
 *   heading2: "ph:text-h-two",
 *   bold: "ph:text-b-bold",
 *   italic: "ph:text-italic",
 * });
 * </script>
 * ```
 */
export function provideVizelIconContext(customIcons?: CustomIconMap): void {
  provide(VizelIconContextKey, { customIcons });
}

/**
 * Inject custom icon mappings from parent IconProvider.
 * Returns an empty object if no provider is present.
 */
export function useVizelIconContext(): VizelIconContextValue {
  return inject(VizelIconContextKey, {});
}
