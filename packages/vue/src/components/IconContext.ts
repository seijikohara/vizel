import type { IconName } from "@vizel/core";
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
export type CustomIconMap = Partial<Record<IconName, string>>;

export interface IconContextValue {
  /**
   * Custom icon mappings that override default Lucide icons.
   */
  customIcons?: CustomIconMap | undefined;
}

/**
 * Injection key for icon context.
 */
export const IconContextKey: InjectionKey<IconContextValue> = Symbol("vizel-icon-context");

/**
 * Provide custom icon mappings to child components.
 * Call this in a parent component's setup to customize icons for all descendants.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { provideIconContext } from "@vizel/vue";
 *
 * // Use Phosphor icons
 * provideIconContext({
 *   heading1: "ph:text-h-one",
 *   heading2: "ph:text-h-two",
 *   bold: "ph:text-b-bold",
 *   italic: "ph:text-italic",
 * });
 * </script>
 * ```
 */
export function provideIconContext(customIcons?: CustomIconMap): void {
  provide(IconContextKey, { customIcons });
}

/**
 * Inject custom icon mappings from parent IconProvider.
 * Returns an empty object if no provider is present.
 */
export function useIconContext(): IconContextValue {
  return inject(IconContextKey, {});
}
