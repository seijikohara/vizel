<script setup lang="ts">
import {
  createVizelRelativeTimeTicker,
  resolveVizelSaveIndicatorView,
  type VizelLocale,
  type VizelSaveStatus,
} from "@vizel/core";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import VizelIcon from "./VizelIcon.vue";

export interface VizelSaveIndicatorProps {
  /** Current save status */
  status: VizelSaveStatus;
  /** Timestamp of last successful save */
  lastSaved?: Date | null;
  /** Show relative timestamp (default: true) */
  showTimestamp?: boolean;
  /** Custom class name */
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = withDefaults(defineProps<VizelSaveIndicatorProps>(), {
  showTimestamp: true,
});

const relativeTime = ref("");
const tickerState: { instance: ReturnType<typeof createVizelRelativeTimeTicker> | null } = {
  instance: null,
};

onMounted(() => {
  const instance = createVizelRelativeTimeTicker({
    getDate: () => props.lastSaved,
    getLocale: () => props.locale,
    onTick: (text) => {
      relativeTime.value = text;
    },
  });
  tickerState.instance = instance;
  instance.mount();
});

onBeforeUnmount(() => {
  tickerState.instance?.unmount();
  tickerState.instance = null;
});

const view = computed(() =>
  resolveVizelSaveIndicatorView(
    props.status,
    props.locale,
    props.lastSaved ?? null,
    relativeTime.value,
    props.showTimestamp
  )
);
</script>

<template>
  <div
    :class="['vizel-save-indicator', `vizel-save-indicator--${props.status}`, $props.class]"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    data-vizel-save-indicator
  >
    <span class="vizel-save-indicator-icon" aria-hidden="true">
      <span v-if="view.isSpinner" class="vizel-save-indicator-spinner" aria-hidden="true">
        <VizelIcon :name="view.iconName" />
      </span>
      <VizelIcon v-else :name="view.iconName" />
    </span>
    <span class="vizel-save-indicator-text">{{ view.text }}</span>
    <span v-if="view.shouldShowTimestamp" class="vizel-save-indicator-timestamp">{{
      relativeTime
    }}</span>
  </div>
</template>
