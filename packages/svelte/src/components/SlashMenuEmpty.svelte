<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  class?: string;
  children?: Snippet;
}

let { class: className, children }: Props = $props();
</script>

<div class="vizel-slash-menu-empty {className ?? ''}">
  {#if children}
    {@render children()}
  {:else}
    No results
  {/if}
</div>
