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
  /**
   * Stable id for the `role="option"` element. The listbox root's
   * `aria-activedescendant` points at this id when the item is the active
   * selection, matching the WAI-ARIA combobox pattern. The spec always
   * supplies the id for a rendered item; the optional `undefined` keeps the
   * prop assignable from the optional spec field under
   * `exactOptionalPropertyTypes`.
   */
  id?: string | undefined;
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
    :id="id"
    :class="[
      'vizel-slash-menu-item',
      { 'is-selected': isSelected },
      $props.class,
    ]"
    role="option"
    :aria-selected="isSelected"
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
