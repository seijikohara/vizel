<script setup lang="ts">
export interface VizelToolbarButtonProps {
  /** Whether the button is in active state */
  isActive?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Tooltip title */
  title?: string;
  /** Custom class name */
  class?: string;
  /** Action identifier for testing */
  action?: string;
}

const props = defineProps<VizelToolbarButtonProps>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-pressed="isActive"
    :class="[
      'vizel-bubble-menu-button',
      { 'is-active': isActive },
      $props.class,
    ]"
    :title="title"
    :data-active="isActive || undefined"
    :data-action="props.action"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
