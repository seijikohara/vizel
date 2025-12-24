<script lang="ts">
  import type { SlashCommandItem } from "@vizel/core";

  interface Props {
    item: SlashCommandItem;
    isSelected?: boolean;
    class?: string;
    onclick?: () => void;
  }

  let {
    item,
    isSelected = false,
    class: className,
    onclick,
  }: Props = $props();
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
