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
  createVizelBlockMenuActions,
  createVizelNodeTypes,
  groupVizelBlockMenuActions,
  getVizelTurnIntoOptions,
  VIZEL_BLOCK_MENU_EVENT,
  vizelDefaultBlockMenuActions,
  vizelDefaultNodeTypes,
  type VizelBlockMenuOpenDetail,
} from "@vizel/core";
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
let menuRef = $state<HTMLDivElement | null>(null);
let submenuRef = $state<HTMLDivElement | null>(null);

const groups = $derived(
  menuState ? groupVizelBlockMenuActions(effectiveActions) : [],
);

const turnIntoOptions = $derived(
  menuState ? getVizelTurnIntoOptions(menuState.editor, effectiveNodeTypes) : [],
);

function close() {
  menuState = null;
  showTurnInto = false;
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

// Manage event listeners
$effect(() => {
  const handleOpen = (e: Event) => {
    const detail = (e as CustomEvent<VizelBlockMenuOpenDetail>).detail;
    menuState = {
      ...detail,
      x: detail.handleRect.left,
      y: detail.handleRect.bottom + 4,
    };
    showTurnInto = false;
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
    const target = e.target as HTMLElement;
    if (
      menuRef &&
      !menuRef.contains(target) &&
      (!submenuRef || !submenuRef.contains(target))
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
</script>

{#if menuState}
  <div
    bind:this={menuRef}
    class="vizel-block-menu {className ?? ''}"
    style="left: {menuState.x}px; top: {menuState.y}px;"
    role="menu"
    aria-label={locale?.blockMenu.label ?? "Block menu"}
    data-vizel-block-menu
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
      aria-haspopup="true"
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
        class="vizel-block-menu-submenu"
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
