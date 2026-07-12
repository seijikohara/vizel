<script setup lang="ts">
import type { CustomIconMap } from "@vizel/core";

import { provideVizelIcons } from "./VizelIconContext.ts";

/**
 * Props for VizelIconProvider component.
 */
export interface VizelIconProviderProps {
  /**
   * Custom icon mappings to override default Lucide icons.
   * Any icon not specified will fall back to the default Lucide icon.
   *
   * @example
   * ```vue
   * <template>
   *   <!-- Use Material Design Icons for some icons -->
   *   <VizelIconProvider :icons="{ bold: 'mdi:format-bold', italic: 'mdi:format-italic' }">
   *     <App />
   *   </VizelIconProvider>
   *
   *   <!-- Use Heroicons -->
   *   <VizelIconProvider :icons="{ check: 'heroicons:check', warning: 'heroicons:exclamation-triangle' }">
   *     <App />
   *   </VizelIconProvider>
   * </template>
   * ```
   */
  icons?: CustomIconMap;
}

const props = defineProps<VizelIconProviderProps>();

// Provide icons to all descendants. Wrap the prop access in a getter so the
// injected context updates when `icons` changes after mount.
provideVizelIcons(() => props.icons);
</script>

<template>
  <slot />
</template>
