<script lang="ts" module>
import type { Editor, VizelBlockMenuAction, VizelLocale, VizelNodeTypeOption } from "@vizel/core";

export interface VizelBlockMenuProps {
  /**
   * Bind this menu to a specific editor. Falls back to the editor from
   * `VizelProvider` context. When set (either way), the menu only reacts to
   * drag-handle events from the bound editor, so multiple editors on the
   * same page do not cross-trigger each other's menus.
   */
  editor?: Editor | null;
  /** Custom block menu actions (replaces defaults) */
  actions?: readonly VizelBlockMenuAction[];
  /** Custom node types for "Turn into" submenu */
  nodeTypes?: readonly VizelNodeTypeOption[];
  /** Additional class name */
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import {
  buildVizelBlockMenuSpec,
  createVizelBlockMenuActions,
  createVizelBlockMenuTriggerController,
  createVizelNodeTypes,
  getVizelTurnIntoOptions,
  shouldFlipSubmenu,
  vizelDefaultBlockMenuActions,
  vizelDefaultNodeTypes,
  type VizelBlockMenuOpenDetail,
} from "@vizel/core";
import { createVizelPopoverController } from "@vizel/headless";
import { tick } from "svelte";
import { getVizelContextSafe } from "./VizelContext.js";
import VizelIcon from "./VizelIcon.svelte";

let {
  editor: editorProp,
  actions,
  nodeTypes,
  class: className,
  locale,
}: VizelBlockMenuProps = $props();

const contextEditor = getVizelContextSafe();
const boundEditor = $derived<Editor | null>(editorProp ?? contextEditor?.current ?? null);

const effectiveActions = $derived(actions ?? (locale ? createVizelBlockMenuActions(locale) : vizelDefaultBlockMenuActions));
const effectiveNodeTypes = $derived(nodeTypes ?? (locale ? createVizelNodeTypes(locale) : vizelDefaultNodeTypes));

let menuState = $state<VizelBlockMenuOpenDetail | null>(null);
let showTurnInto = $state(false);
let submenuFlipped = $state(false);
let menuRef = $state<HTMLDivElement | null>(null);
let submenuRef = $state<HTMLDivElement | null>(null);

const turnIntoOptions = $derived(
  menuState ? getVizelTurnIntoOptions(menuState.editor, effectiveNodeTypes) : [],
);

const spec = $derived(
  buildVizelBlockMenuSpec(effectiveActions, turnIntoOptions, showTurnInto, locale),
);

function close() {
  const editor = menuState?.editor;
  menuState = null;
  showTurnInto = false;
  editor?.view.dom.focus();
}

function handleAction(action: VizelBlockMenuAction) {
  if (!menuState) return;
  action.run(menuState.editor, menuState.pos, menuState.node);
  close();
}

function handleTurnInto(nodeType: VizelNodeTypeOption) {
  if (!menuState) return;
  const { editor, pos } = menuState;
  editor.chain().focus().setNodeSelection(pos).run();
  nodeType.command(editor);
  close();
}

function handleMenuKeyDown(e: KeyboardEvent) {
  if (!menuRef) return;

  const items = Array.from(
    menuRef.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
  );
  if (items.length === 0) return;

  const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
      break;
    case "ArrowUp":
      e.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
      break;
    case "Home":
      e.preventDefault();
      items[0]?.focus();
      break;
    case "End":
      e.preventDefault();
      items.at(-1)?.focus();
      break;
    default:
      break;
  }
}

$effect(() => {
  if (!menuState || !menuRef) return;
  const firstItem = menuRef.querySelector<HTMLButtonElement>(
    '[role="menuitem"]:not([disabled])'
  );
  firstItem?.focus();
});

// The drag-handle extension dispatches `VIZEL_BLOCK_MENU_EVENT` on
// `document`. The subscription lives in a Core controller so this
// component never attaches the custom-event listener directly.
$effect(() => {
  const controller = createVizelBlockMenuTriggerController({
    onOpen: (detail: VizelBlockMenuOpenDetail) => {
      if (boundEditor && detail.editor !== boundEditor) return;
      menuState = detail;
      showTurnInto = false;
    },
  });
  controller.mount();
  return () => controller.unmount();
});

// Anchor the menu to the captured drag-handle rect through a virtual
// element: the handle is a transient overlay node, so the menu reads its
// geometry rather than holding an element reference. The popover
// controller positions the body with floating-ui flip/shift (which
// replaces the former manual clamp) and owns the pointer-outside and
// Escape listeners. The effect re-runs when `menuState` changes, so each
// open re-positions against the fresh rect. The submenu lives inside
// `menuRef`, so the single body mount target also covers it for
// outside-pointer detection.
$effect(() => {
  if (!menuState || !menuRef) return;
  const handleRect = menuState.handleRect;
  const controller = createVizelPopoverController({
    getAnchor: () => ({ getBoundingClientRect: () => handleRect }),
    getBody: () => menuRef,
    placement: "bottom-start",
    offset: 4,
    onDismiss: () => close(),
    dismissOnEscape: true,
  });
  controller.mount();
  return () => controller.unmount();
});

$effect(() => {
  if (!showTurnInto || !menuRef) {
    submenuFlipped = false;
    return;
  }
  void tick().then(() => {
    const parentRect = menuRef?.getBoundingClientRect();
    if (parentRect) {
      submenuFlipped = shouldFlipSubmenu(parentRect, 200);
    }
  });
});
</script>

{#if menuState}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    bind:this={menuRef}
    class="vizel-block-menu {className ?? ''}"
    role={spec.root.role}
    aria-label={spec.root["aria-label"]}
    data-vizel-block-menu
    tabindex={spec.root.tabIndex}
    onkeydown={handleMenuKeyDown}
  >
    {#each spec.sections as section, sectionIndex (section.key)}
      {#if sectionIndex > 0}
        <div class="vizel-block-menu-divider"></div>
      {/if}
      {#each section.items as slot (slot.key)}
        <button
          type="button"
          class="vizel-block-menu-item{slot.data.isDestructive ? ' is-destructive' : ''}"
          role={slot.attrs.role}
          disabled={slot.data.action.isEnabled ? !slot.data.action.isEnabled(menuState.editor, menuState.node) : false}
          onclick={() => handleAction(slot.data.action)}
        >
          <span class="vizel-block-menu-item-icon">
            <VizelIcon name={slot.data.action.icon} />
          </span>
          <span class="vizel-block-menu-item-label">{slot.data.action.label}</span>
          {#if slot.data.action.shortcut}
            <span class="vizel-block-menu-item-shortcut">{slot.data.action.shortcut}</span>
          {/if}
        </button>
      {/each}
    {/each}

    <!-- Turn into submenu trigger -->
    <div class="vizel-block-menu-divider"></div>
    <button
      type="button"
      class="vizel-block-menu-item vizel-block-menu-submenu-trigger"
      role={spec.submenuTrigger.attrs.role}
      aria-haspopup={spec.submenuTrigger.attrs["aria-haspopup"]}
      aria-expanded={spec.submenuTrigger.attrs["aria-expanded"]}
      onmouseenter={() => { showTurnInto = true; }}
      onclick={() => { showTurnInto = !showTurnInto; }}
    >
      <span class="vizel-block-menu-item-icon">
        <VizelIcon name={spec.submenuTrigger.iconName} />
      </span>
      <span class="vizel-block-menu-item-label">{spec.submenuTrigger.label}</span>
    </button>

    <!-- Turn into submenu -->
    {#if showTurnInto && spec.submenu.sections.length > 0}
      <div
        bind:this={submenuRef}
        class="vizel-block-menu-submenu{submenuFlipped ? ' vizel-block-menu-submenu--left' : ''}"
        role={spec.submenu.root.role}
        aria-label={spec.submenu.root["aria-label"]}
      >
        {#each spec.submenu.sections as section (section.key)}
          {#each section.items as slot (slot.key)}
            <button
              type="button"
              class="vizel-block-menu-item"
              role={slot.attrs.role}
              onclick={() => handleTurnInto(slot.data.nodeType)}
            >
              <span class="vizel-block-menu-item-icon">
                <VizelIcon name={slot.data.nodeType.icon} />
              </span>
              <span class="vizel-block-menu-item-label">{slot.data.nodeType.label}</span>
            </button>
          {/each}
        {/each}
      </div>
    {/if}
  </div>
{/if}
