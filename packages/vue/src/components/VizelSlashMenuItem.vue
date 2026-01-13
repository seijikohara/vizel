<script setup lang="ts">
import { splitVizelTextByMatches, type VizelSlashCommandItem } from "@vizel/core";
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
        <template v-for="(part, idx) in splitVizelTextByMatches(item.title, titleMatches)" :key="idx">
          <mark v-if="part.highlight" class="vizel-slash-menu-highlight">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </span>
      <span class="vizel-slash-menu-description">{{ item.description }}</span>
    </div>
    <span v-if="item.shortcut" class="vizel-slash-menu-shortcut">{{ item.shortcut }}</span>
  </button>
</template>
