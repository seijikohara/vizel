<script setup lang="ts">
import { useSlots } from "vue";

export interface VizelSlashMenuEmptyProps {
  /** Custom class name */
  class?: string;
}

defineProps<VizelSlashMenuEmptyProps>();

const slots = useSlots();
</script>

<template>
  <div :class="['vizel-slash-menu-empty', $props.class]" data-vizel-slash-menu-empty="">
    <slot v-if="slots.default" />
    <template v-else>No results</template>
  </div>
</template>
