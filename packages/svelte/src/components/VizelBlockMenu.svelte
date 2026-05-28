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
  clampMenuPosition,
  createVizelBlockMenuActions,
  createVizelBlockMenuTriggerController,
  createVizelNodeTypes,
  getVizelTurnIntoOptions,
  shouldFlipSubmenu,
  vizelDefaultBlockMenuActions,
  vizelDefaultNodeTypes,
  type VizelBlockMenuOpenDetail,
} from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { tick } from "svelte";
import { getVizelContextSafe } from "./VizelContext.js";
import VizelIcon from "./VizelIcon.svelte";

interface BlockMenuState extends VizelBlockMenuOpenDetail {
  x: number;
  y: number;
}

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

let menuState = $state<BlockMenuState | null>(null);
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
// component never attaches the custom-event listener directly
// (ADR-0003, ADR-0007).
$effect(() => {
  const lifecycle = { isMounted: true };
  const controller = createVizelBlockMenuTriggerController({
    onOpen: (detail: VizelBlockMenuOpenDetail) => {
      if (boundEditor && detail.editor !== boundEditor) return;
      menuState = {
        ...detail,
        x: detail.handleRect.left,
        y: detail.handleRect.bottom + 4,
      };
      showTurnInto = false;

      void tick().then(() => {
        // Guard against menus that close while the microtask is queued —
        // without the check, a stale `menuState` would be re-published with
        // clamped coordinates.
        if (!lifecycle.isMounted) return;
        const el = menuRef;
        if (!el || !menuState) return;
        const clamped = clampMenuPosition(detail.handleRect, el.offsetWidth, el.offsetHeight);
        menuState = { ...menuState, x: clamped.x, y: clamped.y };
      });
    },
  });
  controller.mount();
  return () => {
    lifecycle.isMounted = false;
    controller.unmount();
  };
});

// Pointer-outside and Escape dismissal route through `createVizelDismissable`
// from `@vizel/headless` so this component never attaches document listeners
// directly (ADR-0003, ADR-0007). The submenu lives inside `menuRef`, so a
// single mount target covers both surfaces for outside-pointer detection.
// Escape keeps the original semantics (close without `preventDefault`), so
// `captureEscape` stays off.
$effect(() => {
  if (!menuState || !menuRef) return;
  const controller = createVizelDismissable({
    onPointerOutside: () => close(),
    onEscape: () => close(),
  });
  controller.mount(menuRef);
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
    style="left: {menuState.x}px; top: {menuState.y}px;"
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
