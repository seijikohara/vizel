<script setup lang="ts">
import { formatRelativeTime, type SaveStatus } from "@vizel/core";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Icon from "./Icon.vue";

export interface SaveIndicatorProps {
  /** Current save status */
  status: SaveStatus;
  /** Timestamp of last successful save */
  lastSaved?: Date | null;
  /** Show relative timestamp (default: true) */
  showTimestamp?: boolean;
  /** Custom class name */
  class?: string;
}

const props = withDefaults(defineProps<SaveIndicatorProps>(), {
  showTimestamp: true,
});

const relativeTime = ref("");
let intervalId: ReturnType<typeof setInterval> | null = null;

function updateTime() {
  if (props.lastSaved) {
    relativeTime.value = formatRelativeTime(props.lastSaved);
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
  switch (props.status) {
    case "saved":
      return "Saved";
    case "saving":
      return "Saving...";
    case "unsaved":
      return "Unsaved";
    case "error":
      return "Error saving";
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
    data-vizel-save-indicator
  >
    <span class="vizel-save-indicator-icon" aria-hidden="true">
      <template v-if="props.status === 'saved'">
        <Icon name="check" />
      </template>
      <template v-else-if="props.status === 'saving'">
        <span class="vizel-save-indicator-spinner" aria-hidden="true">
          <Icon name="loader" />
        </span>
      </template>
      <template v-else-if="props.status === 'unsaved'">
        <Icon name="circle" />
      </template>
      <template v-else-if="props.status === 'error'">
        <Icon name="warning" />
      </template>
    </span>
    <span class="vizel-save-indicator-text">{{ statusText }}</span>
    <span v-if="shouldShowTimestamp" class="vizel-save-indicator-timestamp">{{ relativeTime }}</span>
  </div>
</template>
