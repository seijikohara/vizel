<script setup lang="ts">
defineProps<{
  class?: string;
}>();
</script>

<template>
  <span :class="['vizel-bubble-menu-divider', $props.class]" />
</template>
