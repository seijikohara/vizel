<script lang="ts" module>
import type { Snippet } from "svelte";

export interface SlashMenuEmptyProps {
  /** Custom class name */
  class?: string;
  /** Custom content */
  children?: Snippet;
}
</script>

<script lang="ts">
let { class: className, children }: SlashMenuEmptyProps = $props();
</script>

<div class="vizel-slash-menu-empty {className ?? ''}" data-vizel-slash-menu-empty="">
  {#if children}
    {@render children()}
  {:else}
    No results
  {/if}
</div>
