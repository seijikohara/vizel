<script setup lang="ts">
export interface VizelToolbarDividerProps {
  /** Custom class name */
  class?: string;
}

defineProps<VizelToolbarDividerProps>();
</script>

<template>
  <span :class="['vizel-bubble-menu-divider', $props.class]" />
</template>
