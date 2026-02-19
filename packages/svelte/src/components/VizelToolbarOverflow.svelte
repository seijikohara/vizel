<script lang="ts" module>
import type { Editor, VizelLocale, VizelToolbarActionItem } from "@vizel/core";

export interface VizelToolbarOverflowProps {
  editor: Editor;
  actions: VizelToolbarActionItem[];
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import { formatVizelTooltip, isVizelToolbarDropdownAction, vizelEnLocale } from "@vizel/core";
import VizelIcon from "./VizelIcon.svelte";
import VizelToolbarButton from "./VizelToolbarButton.svelte";
import VizelToolbarDropdown from "./VizelToolbarDropdown.svelte";

let {
  editor,
  actions,
  class: className,
  locale,
}: VizelToolbarOverflowProps = $props();

let isOpen = $state(false);
let containerEl: HTMLDivElement | undefined = $state(undefined);
let triggerEl: HTMLButtonElement | undefined = $state(undefined);

function close() {
  isOpen = false;
  triggerEl?.focus();
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
    if (!(e.target instanceof Node)) return;
    if (containerEl && !containerEl.contains(e.target)) {
      close();
    }
  }
  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
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
      bind:this={triggerEl}
      type="button"
      class="vizel-toolbar-overflow-trigger"
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-label={locale?.toolbar.moreActions ?? vizelEnLocale.toolbar.moreActions}
      onclick={toggle}
    >
      <VizelIcon name="ellipsis" />
    </button>

    {#if isOpen}
      <div class="vizel-toolbar-overflow-popover" role="group">
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
