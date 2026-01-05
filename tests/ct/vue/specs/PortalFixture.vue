<script setup lang="ts">
import type { PortalLayer } from "@vizel/core";
import { Portal } from "@vizel/vue";

interface Props {
  layer?: PortalLayer;
  disabled?: boolean;
  class?: string;
  withOverflowContainer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  layer: "dropdown",
  disabled: false,
  withOverflowContainer: false,
});
</script>

<template>
  <div
    v-if="withOverflowContainer"
    data-testid="portal-fixture"
    :style="{
      overflow: 'hidden',
      width: '100px',
      height: '50px',
      position: 'relative',
    }"
  >
    <Portal :layer="layer" :disabled="disabled" :class="props.class">
      <div class="test-portal-content" data-testid="portal-content">
        Portal Content
      </div>
    </Portal>
  </div>
  <div v-else data-testid="portal-fixture">
    <Portal :layer="layer" :disabled="disabled" :class="props.class">
      <div class="test-portal-content" data-testid="portal-content">
        Portal Content
      </div>
    </Portal>
  </div>
</template>
