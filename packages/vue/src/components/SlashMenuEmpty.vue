<script setup lang="ts">
import { useSlots } from "vue";

export interface SlashMenuEmptyProps {
  /** Custom class name */
  class?: string;
}

defineProps<SlashMenuEmptyProps>();

const slots = useSlots();
</script>

<template>
  <div :class="['vizel-slash-menu-empty', $props.class]">
    <slot v-if="slots.default" />
    <template v-else>No results</template>
  </div>
</template>
