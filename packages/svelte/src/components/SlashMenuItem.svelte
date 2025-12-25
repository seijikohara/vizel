<script lang="ts" module>
import type { SlashCommandItem } from "@vizel/core";

export interface SlashMenuItemProps {
  /** The slash command item to display */
  item: SlashCommandItem;
  /** Whether the item is selected */
  isSelected?: boolean;
  /** Custom class name */
  class?: string;
  /** Click handler */
  onclick?: () => void;
}
</script>

<script lang="ts">
let { item, isSelected = false, class: className, onclick }: SlashMenuItemProps = $props();
</script>

<button
  type="button"
  class="vizel-slash-menu-item {isSelected ? 'is-selected' : ''} {className ?? ''}"
  data-selected={isSelected || undefined}
  {onclick}
>
  <span class="vizel-slash-menu-icon">{item.icon}</span>
  <div class="vizel-slash-menu-text">
    <span class="vizel-slash-menu-title">{item.title}</span>
    <span class="vizel-slash-menu-description">{item.description}</span>
  </div>
</button>
