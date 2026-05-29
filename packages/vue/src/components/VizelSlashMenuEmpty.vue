<script setup lang="ts">
export interface VizelSlashMenuEmptyProps {
  /** Custom class name */
  class?: string;
}

defineProps<VizelSlashMenuEmptyProps>();

// The default slot replaces the built-in "No results" text. It passes no
// props, so consumers supply static markup. Typing keeps `slots.default`
// discoverable under Volar.
const slots = defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <div :class="['vizel-slash-menu-empty', $props.class]" data-vizel-slash-menu-empty="">
    <slot v-if="slots.default" />
    <template v-else>No results</template>
  </div>
</template>
