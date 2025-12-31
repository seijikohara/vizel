<script setup lang="ts">
import { SaveIndicator, type SaveStatus } from "@vizel/vue";

const props = withDefaults(
  defineProps<{
    status: SaveStatus;
    lastSaved?: Date | null;
    showTimestamp?: boolean;
    class?: string;
  }>(),
  {
    showTimestamp: true,
  }
);
</script>

<template>
  <SaveIndicator
    :status="props.status"
    :lastSaved="props.lastSaved"
    :showTimestamp="props.showTimestamp"
    :class="props.class"
  />
</template>
