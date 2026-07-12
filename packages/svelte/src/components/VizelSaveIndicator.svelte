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
import { createVizelRelativeTimeTicker, resolveVizelSaveIndicatorView } from "@vizel/core";

import VizelIcon from "./VizelIcon.svelte";

let {
  status,
  lastSaved = null,
  showTimestamp = true,
  class: className,
  locale,
}: VizelSaveIndicatorProps = $props();

let relativeTime = $state("");

$effect(() => {
  const ticker = createVizelRelativeTimeTicker({
    getDate: () => lastSaved,
    getLocale: () => locale,
    onTick: (text) => {
      relativeTime = text;
    },
  });
  ticker.mount();
  return () => ticker.unmount();
});

const view = $derived(
  resolveVizelSaveIndicatorView(status, locale, lastSaved, relativeTime, showTimestamp)
);
</script>

<div
  class="vizel-save-indicator vizel-save-indicator--{status} {className ?? ''}"
  role="status"
  aria-live="polite"
  aria-atomic="true"
  data-vizel-save-indicator
>
  <span class="vizel-save-indicator-icon" aria-hidden="true">
    {#if view.isSpinner}
      <span class="vizel-save-indicator-spinner" aria-hidden="true">
        <VizelIcon name={view.iconName} />
      </span>
    {:else}
      <VizelIcon name={view.iconName} />
    {/if}
  </span>
  <span class="vizel-save-indicator-text">{view.text}</span>
  {#if view.shouldShowTimestamp}
    <span class="vizel-save-indicator-timestamp">{relativeTime}</span>
  {/if}
</div>
