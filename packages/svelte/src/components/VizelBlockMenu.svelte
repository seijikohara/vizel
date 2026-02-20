<script lang="ts" module>
import type { VizelBlockMenuAction, VizelLocale, VizelNodeTypeOption } from "@vizel/core";

export interface VizelBlockMenuProps {
  /** Custom block menu actions (replaces defaults) */
  actions?: VizelBlockMenuAction[];
  /** Custom node types for "Turn into" submenu */
  nodeTypes?: VizelNodeTypeOption[];
  /** Additional class name */
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import {
  clampMenuPosition,
  createVizelBlockMenuActions,
  createVizelNodeTypes,
  groupVizelBlockMenuActions,
  getVizelTurnIntoOptions,
  shouldFlipSubmenu,
  VIZEL_BLOCK_MENU_EVENT,
  vizelDefaultBlockMenuActions,
  vizelDefaultNodeTypes,
  type VizelBlockMenuOpenDetail,
} from "@vizel/core";
import { tick } from "svelte";
import VizelIcon from "./VizelIcon.svelte";

interface BlockMenuState extends VizelBlockMenuOpenDetail {
  x: number;
  y: number;
}

let {
  actions,
  nodeTypes,
  class: className,
  locale,
}: VizelBlockMenuProps = $props();

const effectiveActions = $derived(actions ?? (locale ? createVizelBlockMenuActions(locale) : vizelDefaultBlockMenuActions));
const effectiveNodeTypes = $derived(nodeTypes ?? (locale ? createVizelNodeTypes(locale) : vizelDefaultNodeTypes));

let menuState = $state<BlockMenuState | null>(null);
let showTurnInto = $state(false);
let submenuFlipped = $state(false);
let menuRef = $state<HTMLDivElement | null>(null);
let submenuRef = $state<HTMLDivElement | null>(null);

const groups = $derived(
  menuState ? groupVizelBlockMenuActions(effectiveActions) : [],
);

const turnIntoOptions = $derived(
  menuState ? getVizelTurnIntoOptions(menuState.editor, effectiveNodeTypes) : [],
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

// Focus first menuitem when menu opens
$effect(() => {
  if (!menuState || !menuRef) return;
  // Use tick to wait for DOM render
  const firstItem = menuRef.querySelector<HTMLButtonElement>(
    '[role="menuitem"]:not([disabled])'
  );
  firstItem?.focus();
});

// Manage event listeners
$effect(() => {
  const handleOpen = (e: Event) => {
    if (!(e instanceof CustomEvent)) return;
    const detail = e.detail as VizelBlockMenuOpenDetail;
    menuState = {
      ...detail,
      x: detail.handleRect.left,
      y: detail.handleRect.bottom + 4,
    };
    showTurnInto = false;

    // Clamp menu position to viewport after Svelte renders
    void tick().then(() => {
      const el = menuRef;
      if (!el || !menuState) return;
      const clamped = clampMenuPosition(detail.handleRect, el.offsetWidth, el.offsetHeight);
      menuState = { ...menuState, x: clamped.x, y: clamped.y };
    });
  };

  document.addEventListener(VIZEL_BLOCK_MENU_EVENT, handleOpen);
  return () => {
    document.removeEventListener(VIZEL_BLOCK_MENU_EVENT, handleOpen);
  };
});

// Close on outside click / Escape when menu is open
$effect(() => {
  if (!menuState) return;

  const handleClick = (e: MouseEvent) => {
    if (!(e.target instanceof Node)) return;
    if (
      menuRef &&
      !menuRef.contains(e.target) &&
      (!submenuRef || !submenuRef.contains(e.target))
    ) {
      close();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };

  document.addEventListener("mousedown", handleClick);
  document.addEventListener("keydown", handleKeyDown);

  return () => {
    document.removeEventListener("mousedown", handleClick);
    document.removeEventListener("keydown", handleKeyDown);
  };
});

// Detect whether the submenu should flip to the left side
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
  <div
    bind:this={menuRef}
    class="vizel-block-menu {className ?? ''}"
    style="left: {menuState.x}px; top: {menuState.y}px;"
    role="menu"
    aria-label={locale?.blockMenu.label ?? "Block menu"}
    data-vizel-block-menu
    tabindex="-1"
    onkeydown={handleMenuKeyDown}
  >
    {#each groups as group, groupIndex (groupIndex)}
      {#if groupIndex > 0}
        <div class="vizel-block-menu-divider"></div>
      {/if}
      {#each group as action (action.id)}
        <button
          type="button"
          class="vizel-block-menu-item{action.id === 'delete' ? ' is-destructive' : ''}"
          role="menuitem"
          disabled={action.isEnabled ? !action.isEnabled(menuState.editor, menuState.node) : false}
          onclick={() => handleAction(action)}
        >
          <span class="vizel-block-menu-item-icon">
            <VizelIcon name={action.icon} />
          </span>
          <span class="vizel-block-menu-item-label">{action.label}</span>
          {#if action.shortcut}
            <span class="vizel-block-menu-item-shortcut">{action.shortcut}</span>
          {/if}
        </button>
      {/each}
    {/each}

    <!-- Turn into submenu trigger -->
    <div class="vizel-block-menu-divider"></div>
    <button
      type="button"
      class="vizel-block-menu-item vizel-block-menu-submenu-trigger"
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={showTurnInto}
      onmouseenter={() => { showTurnInto = true; }}
      onclick={() => { showTurnInto = !showTurnInto; }}
    >
      <span class="vizel-block-menu-item-icon">
        <VizelIcon name="arrowRightLeft" />
      </span>
      <span class="vizel-block-menu-item-label">{locale?.blockMenu.turnInto ?? "Turn into"}</span>
    </button>

    <!-- Turn into submenu -->
    {#if showTurnInto && turnIntoOptions.length > 0}
      <div
        bind:this={submenuRef}
        class="vizel-block-menu-submenu{submenuFlipped ? ' vizel-block-menu-submenu--left' : ''}"
        role="menu"
        aria-label={locale?.blockMenu.turnInto ?? "Turn into"}
      >
        {#each turnIntoOptions as nodeType (nodeType.name)}
          <button
            type="button"
            class="vizel-block-menu-item"
            role="menuitem"
            onclick={() => handleTurnInto(nodeType)}
          >
            <span class="vizel-block-menu-item-icon">
              <VizelIcon name={nodeType.icon} />
            </span>
            <span class="vizel-block-menu-item-label">{nodeType.label}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}
