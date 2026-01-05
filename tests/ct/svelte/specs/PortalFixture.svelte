<script lang="ts">
import type { PortalLayer } from "@vizel/core";
import { Portal } from "@vizel/svelte";

interface Props {
  layer?: PortalLayer;
  disabled?: boolean;
  class?: string;
  withOverflowContainer?: boolean;
}

const {
  layer = "dropdown",
  disabled = false,
  class: className,
  withOverflowContainer = false,
}: Props = $props();
</script>

{#if withOverflowContainer}
  <div
    data-testid="portal-fixture"
    style="overflow: hidden; width: 100px; height: 50px; position: relative;"
  >
    <Portal {layer} {disabled} class={className}>
      <div class="test-portal-content" data-testid="portal-content">
        Portal Content
      </div>
    </Portal>
  </div>
{:else}
  <div data-testid="portal-fixture">
    <Portal {layer} {disabled} class={className}>
      <div class="test-portal-content" data-testid="portal-content">
        Portal Content
      </div>
    </Portal>
  </div>
{/if}
