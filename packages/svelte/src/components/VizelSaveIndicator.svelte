<script lang="ts" module>
import type { VizelLocale, VizelSaveStatus } from "@vizel/core";

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
</script>

<script lang="ts">
import { formatVizelRelativeTime } from "@vizel/core";
import VizelIcon from "./VizelIcon.svelte";

let {
  status,
  lastSaved = null,
  showTimestamp = true,
  class: className,
  locale,
}: VizelSaveIndicatorProps = $props();

let relativeTime = $state("");

function updateTime() {
  if (lastSaved) {
    relativeTime = formatVizelRelativeTime(lastSaved, locale);
  } else {
    relativeTime = "";
  }
}

$effect(() => {
  updateTime();
  const intervalId = setInterval(updateTime, 10000);

  return () => {
    clearInterval(intervalId);
  };
});

// Watch lastSaved changes
$effect(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  lastSaved;
  updateTime();
});

const statusText = $derived.by(() => {
  const t = locale?.saveIndicator;
  switch (status) {
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

const shouldShowTimestamp = $derived(showTimestamp && lastSaved && relativeTime && status === "saved");
</script>

<div
  class="vizel-save-indicator vizel-save-indicator--{status} {className ?? ''}"
  role="status"
  aria-live="polite"
  aria-atomic="true"
  data-vizel-save-indicator
>
  <span class="vizel-save-indicator-icon" aria-hidden="true">
    {#if status === "saved"}
      <VizelIcon name="check" />
    {:else if status === "saving"}
      <span class="vizel-save-indicator-spinner" aria-hidden="true">
        <VizelIcon name="loader" />
      </span>
    {:else if status === "unsaved"}
      <VizelIcon name="circle" />
    {:else if status === "error"}
      <VizelIcon name="warning" />
    {/if}
  </span>
  <span class="vizel-save-indicator-text">{statusText}</span>
  {#if shouldShowTimestamp}
    <span class="vizel-save-indicator-timestamp">{relativeTime}</span>
  {/if}
</div>
