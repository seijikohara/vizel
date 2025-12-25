<script setup lang="ts">
export interface BubbleMenuDividerProps {
  /** Custom class name */
  class?: string;
}

defineProps<BubbleMenuDividerProps>();
</script>

<template>
  <span :class="['vizel-bubble-menu-divider', $props.class]" />
</template>
