<script lang="ts" module>
import type { VizelPortalLayer } from "@vizel/core";
import type { Snippet } from "svelte";

/**
 * Props for the Portal component.
 */
export interface VizelPortalProps {
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
  }: VizelPortalProps = $props();

  let host = $state<HTMLDivElement | null>(null);
  let wrapper = $state<HTMLDivElement | null>(null);

  // Mount/unmount the portal wrapper.
  // The previous shape used a `use:portal` action whose closure captured
  // `layer`/`className` at action creation, so prop changes never propagated.
  // Splitting the lifecycle from the attribute updates restores cross-FW
  // parity with React/Vue, where reactive updates to layer/className flow
  // through without remounting the portal contents.
  $effect(() => {
    if (disabled || !host) return;

    const node = host;
    const container = getVizelPortalContainer();
    const w = document.createElement("div");
    w.style.position = "absolute";
    w.style.top = "0";
    w.style.left = "0";

    while (node.firstChild) {
      w.appendChild(node.firstChild);
    }
    container.appendChild(w);
    wrapper = w;

    return () => {
      while (w.firstChild) {
        node.appendChild(w.firstChild);
      }
      w.remove();
      wrapper = null;
    };
  });

  // Reactive attribute updates. Reads `layer` and `className` so any change
  // re-runs without re-mounting the wrapper.
  $effect(() => {
    if (!wrapper) return;
    wrapper.setAttribute("data-vizel-portal-layer", layer);
    wrapper.style.zIndex = String(VIZEL_PORTAL_Z_INDEX[layer]);
    wrapper.className = className ?? "";
  });
</script>

{#if disabled}
  {@render children()}
{:else}
  <div bind:this={host}>
    {@render children()}
  </div>
{/if}
