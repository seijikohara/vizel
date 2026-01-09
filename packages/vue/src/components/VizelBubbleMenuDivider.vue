<script setup lang="ts">
export interface VizelBubbleMenuDividerProps {
  /** Custom class name */
  class?: string;
}

defineProps<VizelBubbleMenuDividerProps>();
</script>

<template>
  <span :class="['vizel-bubble-menu-divider', $props.class]" />
</template>
