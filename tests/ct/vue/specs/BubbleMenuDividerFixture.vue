<script setup lang="ts">
import { BubbleMenuDivider } from "@vizel/vue";

defineProps<{
  class?: string;
}>();
</script>

<template>
  <BubbleMenuDivider :class="$props.class" />
</template>
