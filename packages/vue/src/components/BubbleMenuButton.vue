<script setup lang="ts">
export interface BubbleMenuButtonProps {
  /** Whether the button is in active state */
  isActive?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Tooltip title */
  title?: string;
  /** Custom class name */
  class?: string;
}

defineProps<BubbleMenuButtonProps>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'vizel-bubble-menu-button',
      { 'is-active': isActive },
      $props.class,
    ]"
    :title="title"
    :data-active="isActive || undefined"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
