<script setup lang="ts">
import type { SlashCommandItem } from "@vizel/core";

defineProps<{
  item: SlashCommandItem;
  isSelected?: boolean;
  class?: string;
}>();

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
    <span class="vizel-slash-menu-icon">{{ item.icon }}</span>
    <div class="vizel-slash-menu-text">
      <span class="vizel-slash-menu-title">{{ item.title }}</span>
      <span class="vizel-slash-menu-description">{{ item.description }}</span>
    </div>
  </button>
</template>
