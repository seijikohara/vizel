<script lang="ts">
import { VizelPortal, type VizelPortalLayer } from "@vizel/svelte";

interface Props {
  layer?: VizelPortalLayer;
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
    <VizelPortal {layer} {disabled} class={className}>
      <div class="test-portal-content" data-testid="portal-content">Portal Content</div>
    </VizelPortal>
  </div>
{:else}
  <div data-testid="portal-fixture">
    <VizelPortal {layer} {disabled} class={className}>
      <div class="test-portal-content" data-testid="portal-content">Portal Content</div>
    </VizelPortal>
  </div>
{/if}
