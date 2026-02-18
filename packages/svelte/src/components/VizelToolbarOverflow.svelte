<script lang="ts" module>
import type { Editor, VizelToolbarActionItem } from "@vizel/core";

export interface VizelToolbarOverflowProps {
  editor: Editor;
  actions: VizelToolbarActionItem[];
  class?: string;
}
</script>

<script lang="ts">
import { formatVizelTooltip, isVizelToolbarDropdownAction } from "@vizel/core";
import VizelIcon from "./VizelIcon.svelte";
import VizelToolbarButton from "./VizelToolbarButton.svelte";
import VizelToolbarDropdown from "./VizelToolbarDropdown.svelte";

let {
  editor,
  actions,
  class: className,
}: VizelToolbarOverflowProps = $props();

let isOpen = $state(false);
let containerEl: HTMLDivElement | undefined = $state(undefined);

function close() {
  isOpen = false;
}

function toggle() {
  isOpen = !isOpen;
}

function handleActionClick(action: VizelToolbarActionItem) {
  if (!isVizelToolbarDropdownAction(action)) {
    action.run(editor);
    close();
  }
}

$effect(() => {
  if (!isOpen) return;

  function handleClick(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      close();
    }
  }
  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  document.addEventListener("mousedown", handleClick);
  document.addEventListener("keydown", handleKey);
  return () => {
    document.removeEventListener("mousedown", handleClick);
    document.removeEventListener("keydown", handleKey);
  };
});
</script>

{#if actions.length > 0}
  <div
    bind:this={containerEl}
    class="vizel-toolbar-overflow {className ?? ''}"
    data-vizel-toolbar-overflow
  >
    <button
      type="button"
      class="vizel-toolbar-overflow-trigger"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-label="More actions"
      onclick={toggle}
    >
      <VizelIcon name="ellipsis" />
    </button>

    {#if isOpen}
      <div class="vizel-toolbar-overflow-popover" role="menu">
        {#each actions as action (action.id)}
          {#if isVizelToolbarDropdownAction(action)}
            <VizelToolbarDropdown {editor} dropdown={action} />
          {:else}
            <VizelToolbarButton
              action={action.id}
              isActive={action.isActive(editor)}
              disabled={!action.isEnabled(editor)}
              title={formatVizelTooltip(action.label, action.shortcut)}
              onclick={() => handleActionClick(action)}
            >
              <VizelIcon name={action.icon} />
            </VizelToolbarButton>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}
