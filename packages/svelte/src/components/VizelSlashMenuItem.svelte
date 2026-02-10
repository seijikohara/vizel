<script lang="ts" module>
import type { VizelSlashCommandItem } from "@vizel/core";

export interface VizelSlashMenuItemProps {
  /** The slash command item to display */
  item: VizelSlashCommandItem;
  /** Whether the item is selected */
  isSelected?: boolean;
  /** Custom class name */
  class?: string;
  /** Click handler */
  onclick?: () => void;
  /** Match indices for highlighting (from fuzzy search) */
  titleMatches?: [number, number][];
}
</script>

<script lang="ts">
import { splitVizelTextByMatches } from "@vizel/core";
import VizelIcon from "./VizelIcon.svelte";

let {
  item,
  isSelected = false,
  class: className,
  onclick,
  titleMatches,
}: VizelSlashMenuItemProps = $props();

const parts = $derived(splitVizelTextByMatches(item.title, titleMatches));
</script>

<button
  type="button"
  class="vizel-slash-menu-item {isSelected ? 'is-selected' : ''} {className ?? ''}"
  role="option"
  aria-selected={isSelected}
  data-selected={isSelected || undefined}
  {onclick}
>
  <span class="vizel-slash-menu-icon">
    <VizelIcon name={item.icon} />
  </span>
  <div class="vizel-slash-menu-text">
    <span class="vizel-slash-menu-title">
      {#each parts as part}
        {#if part.highlight}
          <mark class="vizel-slash-menu-highlight">{part.text}</mark>
        {:else}
          {part.text}
        {/if}
      {/each}
    </span>
    <span class="vizel-slash-menu-description">{item.description}</span>
  </div>
  {#if item.shortcut}
    <span class="vizel-slash-menu-shortcut">{item.shortcut}</span>
  {/if}
</button>
