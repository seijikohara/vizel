<script setup lang="ts">
import { VizelToolbarDivider } from "@vizel/vue";

defineProps<{
  class?: string;
}>();
</script>

<template>
  <VizelToolbarDivider :class="$props.class" />
</template>
