<script lang="ts" module>
import type { VizelPortalLayer } from "@vizel/core";
import type { Snippet } from "svelte";

/**
 * Props for the Portal component.
 */
export interface PortalProps {
  /** Content to render in the portal */
  children: Snippet;
  /** Z-index layer for the portal content */
  layer?: VizelPortalLayer;
  /** Additional CSS class name */
  class?: string;
  /** Whether the portal is disabled (renders children in place) */
  disabled?: boolean;
}
</script>

<script lang="ts">
  import { getVizelPortalContainer, VIZEL_PORTAL_Z_INDEX } from "@vizel/core";

  const {
    children,
    layer = "dropdown",
    class: className,
    disabled = false,
  }: PortalProps = $props();

  // Create portal action that moves content to the portal container
  function portal(node: HTMLElement) {
    const container = getVizelPortalContainer();

    // Create wrapper element
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-vizel-portal-layer", layer);
    if (className) {
      wrapper.className = className;
    }
    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.zIndex = String(VIZEL_PORTAL_Z_INDEX[layer]);

    // Move node's children to wrapper
    while (node.firstChild) {
      wrapper.appendChild(node.firstChild);
    }

    container.appendChild(wrapper);

    return {
      destroy() {
        // Move content back to original location for cleanup
        while (wrapper.firstChild) {
          node.appendChild(wrapper.firstChild);
        }
        wrapper.remove();
      },
    };
  }
</script>

{#if disabled}
  {@render children()}
{:else}
  <div use:portal>
    {@render children()}
  </div>
{/if}
