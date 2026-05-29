<script lang="ts" module>
import type { VizelSlashCommandItem } from "@vizel/core";

export interface VizelSlashMenuItemProps {
  /** The slash command item to display */
  item: VizelSlashCommandItem;
  /** Whether the item is selected */
  isSelected?: boolean;
  /** Custom class name */
  class?: string;
  /**
   * Stable id for the `role="option"` element. The listbox root's
   * `aria-activedescendant` points at this id when the item is the active
   * selection, matching the WAI-ARIA combobox pattern. The spec always
   * supplies the id for a rendered item; the optional `undefined` keeps the
   * prop assignable from the optional spec field under
   * `exactOptionalPropertyTypes`.
   */
  id?: string | undefined;
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
  id,
  onclick,
  titleMatches,
}: VizelSlashMenuItemProps = $props();

const parts = $derived(splitVizelTextByMatches(item.title, titleMatches));
</script>

<button
  type="button"
  {id}
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
