<script setup lang="ts">
import type { VizelSlashCommandItem } from "@vizel/core";
import VizelIcon from "./VizelIcon.vue";

export interface VizelSlashMenuItemProps {
  /** The slash command item to display */
  item: VizelSlashCommandItem;
  /** Whether the item is selected */
  isSelected?: boolean;
  /** Custom class name */
  class?: string;
  /** Match indices for highlighting (from fuzzy search) */
  titleMatches?: [number, number][];
}

defineProps<VizelSlashMenuItemProps>();

const emit = defineEmits<{
  click: [];
}>();

/**
 * Highlight text based on match indices from fuzzy search
 */
function highlightMatches(
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

<template>
  <button
    type="button"
    :class="[
      'vizel-slash-menu-item',
      { 'is-selected': isSelected },
      $props.class,
    ]"
    :data-selected="isSelected || undefined"
    @click="emit('click')"
  >
    <span class="vizel-slash-menu-icon">
      <VizelIcon :name="item.icon" />
    </span>
    <div class="vizel-slash-menu-text">
      <span class="vizel-slash-menu-title">
        <template v-for="(part, idx) in highlightMatches(item.title, titleMatches)" :key="idx">
          <mark v-if="part.highlight" class="vizel-slash-menu-highlight">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </span>
      <span class="vizel-slash-menu-description">{{ item.description }}</span>
    </div>
    <span v-if="item.shortcut" class="vizel-slash-menu-shortcut">{{ item.shortcut }}</span>
  </button>
</template>
