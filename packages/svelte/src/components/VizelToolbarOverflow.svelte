<script lang="ts" module>
import type { Editor, VizelLocale, VizelToolbarActionItem } from "@vizel/core";

export interface VizelToolbarOverflowProps {
  editor: Editor;
  actions: readonly VizelToolbarActionItem[];
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import { formatVizelTooltip, isVizelToolbarDropdownAction, vizelEnLocale } from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
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

// Pointer-outside and Escape dismissal route through `createVizelDismissable`
// from `@vizel/headless` so this component never attaches document listeners
// directly (ADR-0003, ADR-0007).
$effect(() => {
  if (!isOpen || !containerEl) return;

  // `captureEscape: true` runs the Escape handler in the capture phase and
  // calls `stopImmediatePropagation()`. The overflow popover owns Escape
  // while open; otherwise the editor's bubble-phase keymap also fires and
  // resets the selection or drops focus from the trigger. ADR-0007
  // delegates this adapter-side contract to the controller.
  const controller = createVizelDismissable({
    onPointerOutside: () => close(),
    onEscape: () => close(),
    captureEscape: true,
  });
  controller.mount(containerEl);
  return () => controller.unmount();
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
