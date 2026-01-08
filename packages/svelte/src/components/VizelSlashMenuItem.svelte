<script lang="ts" module>
import type { VizelSlashCommandItem } from "@vizel/core";

export interface SlashMenuItemProps {
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

/**
 * Highlight text based on match indices from fuzzy search
 */
export function highlightMatches(
  text: string,
  matches?: [number, number][]
): { text: string; highlight: boolean }[] {
  if (!matches || matches.length === 0) {
    return [{ text, highlight: false }];
  }

  const result: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;

  for (const [start, end] of matches) {
    // Add text before match
    if (start > lastIndex) {
      result.push({ text: text.slice(lastIndex, start), highlight: false });
    }
    // Add highlighted match
    result.push({ text: text.slice(start, end + 1), highlight: true });
    lastIndex = end + 1;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), highlight: false });
  }

  return result;
}
</script>

<script lang="ts">
import VizelIcon from "./VizelIcon.svelte";

let {
  item,
  isSelected = false,
  class: className,
  onclick,
  titleMatches,
}: SlashMenuItemProps = $props();

const parts = $derived(highlightMatches(item.title, titleMatches));
</script>

<button
  type="button"
  class="vizel-slash-menu-item {isSelected ? 'is-selected' : ''} {className ?? ''}"
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
