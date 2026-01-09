<script setup lang="ts">
import { VizelBubbleMenuDivider } from "@vizel/vue";

defineProps<{
  class?: string;
}>();
</script>

<template>
  <VizelBubbleMenuDivider :class="$props.class" />
</template>
