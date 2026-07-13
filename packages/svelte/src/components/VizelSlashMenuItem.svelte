<script lang="ts" module>
import type { VizelCommandSpec } from "@vizel/core";

export interface VizelSlashMenuItemProps {
  /** The command spec to display (label, description, icon, shortcut). */
  item: VizelCommandSpec;
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
import { formatVizelShortcut, splitVizelTextByMatches } from "@vizel/core";

import VizelIcon from "./VizelIcon.svelte";

let {
  item,
  isSelected = false,
  class: className,
  id,
  onclick,
  titleMatches,
}: VizelSlashMenuItemProps = $props();

const parts = $derived(splitVizelTextByMatches(item.label, titleMatches));
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
  {#if item.icon}
    <span class="vizel-slash-menu-icon">
      <VizelIcon name={item.icon} />
    </span>
  {/if}
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
    {#if item.description}
      <span class="vizel-slash-menu-description">{item.description}</span>
    {/if}
  </div>
  {#if item.shortcut}
    <span class="vizel-slash-menu-shortcut">{formatVizelShortcut(item.shortcut)}</span>
  {/if}
</button>
