<script setup lang="ts">
import {
  getVizelPortalContainer,
  VIZEL_PORTAL_ID,
  VIZEL_PORTAL_Z_INDEX,
  type VizelPortalLayer,
} from "@vizel/core";
import { computed, onMounted, ref, Teleport } from "vue";

/**
 * Props for the Portal component.
 */
export interface VizelPortalProps {
  /** Z-index layer for the portal content */
  layer?: VizelPortalLayer;
  /** Additional CSS class name */
  class?: string;
  /** Whether the portal is disabled (renders children in place) */
  disabled?: boolean;
}

const props = withDefaults(defineProps<VizelPortalProps>(), {
  layer: "dropdown",
  disabled: false,
});

const mounted = ref(false);

onMounted(() => {
  // Ensure portal container exists
  getVizelPortalContainer();
  mounted.value = true;
});

const portalTarget = computed(() => `#${VIZEL_PORTAL_ID}`);

const wrapperStyle = computed(() => ({
  position: "absolute" as const,
  top: 0,
  left: 0,
  zIndex: VIZEL_PORTAL_Z_INDEX[props.layer],
}));
</script>

<template>
  <Teleport v-if="mounted && !disabled" :to="portalTarget">
    <div
      :data-vizel-portal-layer="layer"
      :class="$props.class"
      :style="wrapperStyle"
    >
      <slot />
    </div>
  </Teleport>
  <slot v-else />
</template>
