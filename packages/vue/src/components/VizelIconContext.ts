import type { CustomIconMap, VizelIconContextValue } from "@vizel/core";
import type { InjectionKey } from "vue";
import { inject, provide } from "vue";

export type { CustomIconMap, VizelIconContextValue };

/**
 * Injection key for icon context (internal use only).
 */
const VIZEL_ICON_CONTEXT_KEY: InjectionKey<VizelIconContextValue> = Symbol("vizel-icon-context");

/**
 * Provide custom icon mappings to child components.
 * Call this in a parent component's setup to customize icons for all descendants.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { provideVizelIcons } from "@vizel/vue";
 *
 * // Use Phosphor icons
 * provideVizelIcons({
 *   heading1: "ph:text-h-one",
 *   heading2: "ph:text-h-two",
 *   bold: "ph:text-b-bold",
 *   italic: "ph:text-italic",
 * });
 * </script>
 * ```
 */
export function provideVizelIcons(customIcons?: CustomIconMap): void {
  provide(VIZEL_ICON_CONTEXT_KEY, { customIcons });
}

/**
 * Inject custom icon mappings from parent IconProvider.
 * Returns an empty object if no provider is present.
 */
export function useVizelIconContext(): VizelIconContextValue {
  return inject(VIZEL_ICON_CONTEXT_KEY, {});
}
