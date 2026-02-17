<script setup lang="ts">
import { formatVizelRelativeTime, type VizelLocale, type VizelSaveStatus } from "@vizel/core";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
let intervalId: ReturnType<typeof setInterval> | null = null;

function updateTime() {
  if (props.lastSaved) {
    relativeTime.value = formatVizelRelativeTime(props.lastSaved, props.locale);
  } else {
    relativeTime.value = "";
  }
}

onMounted(() => {
  updateTime();
  intervalId = setInterval(updateTime, 10000);
});

watch(
  () => props.lastSaved,
  () => {
    updateTime();
  }
);

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

const statusText = computed(() => {
  const t = props.locale?.saveIndicator;
  switch (props.status) {
    case "saved":
      return t?.saved ?? "Saved";
    case "saving":
      return t?.saving ?? "Saving...";
    case "unsaved":
      return t?.unsaved ?? "Unsaved";
    case "error":
      return t?.error ?? "Error saving";
    default:
      return "";
  }
});

const shouldShowTimestamp = computed(() => {
  return props.showTimestamp && props.lastSaved && relativeTime.value && props.status === "saved";
});
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
      <template v-if="props.status === 'saved'">
        <VizelIcon name="check" />
      </template>
      <template v-else-if="props.status === 'saving'">
        <span class="vizel-save-indicator-spinner" aria-hidden="true">
          <VizelIcon name="loader" />
        </span>
      </template>
      <template v-else-if="props.status === 'unsaved'">
        <VizelIcon name="circle" />
      </template>
      <template v-else-if="props.status === 'error'">
        <VizelIcon name="warning" />
      </template>
    </span>
    <span class="vizel-save-indicator-text">{{ statusText }}</span>
    <span v-if="shouldShowTimestamp" class="vizel-save-indicator-timestamp">{{ relativeTime }}</span>
  </div>
</template>
