<script lang="ts" module>
import type { CustomIconMap } from "@vizel/core";
import type { Snippet } from "svelte";

/**
 * Props for VizelIconProvider component.
 */
export interface VizelIconProviderProps {
  /**
   * Custom icon mappings to override default Lucide icons.
   * Any icon not specified will fall back to the default Lucide icon.
   *
   * @example
   * ```svelte
   * <VizelIconProvider icons={{ bold: "mdi:format-bold", italic: "mdi:format-italic" }}>
   *   <App />
   * </VizelIconProvider>
   *
   * <VizelIconProvider icons={{ check: "heroicons:check", warning: "heroicons:exclamation-triangle" }}>
   *   <App />
   * </VizelIconProvider>
   * ```
   */
  icons?: CustomIconMap;
  /**
   * Child content to render inside the provider.
   */
  children?: Snippet;
}
</script>

<script lang="ts">
import { setVizelIconContext } from "./VizelIconContext.js";

const { icons, children }: VizelIconProviderProps = $props();

// Expose `customIcons` through a getter so descendants observe the latest
// `icons` prop instead of the value captured at mount.
setVizelIconContext({
  get customIcons() {
    return icons;
  },
});
</script>

{#if children}
  {@render children()}
{/if}
