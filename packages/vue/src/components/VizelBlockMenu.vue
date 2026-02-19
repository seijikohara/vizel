<script setup lang="ts">
import {
  createVizelBlockMenuActions,
  createVizelNodeTypes,
  getVizelTurnIntoOptions,
  groupVizelBlockMenuActions,
  VIZEL_BLOCK_MENU_EVENT,
  type VizelBlockMenuAction,
  type VizelBlockMenuOpenDetail,
  type VizelLocale,
  type VizelNodeTypeOption,
  vizelDefaultBlockMenuActions,
  vizelDefaultNodeTypes,
} from "@vizel/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import VizelIcon from "./VizelIcon.vue";

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

interface BlockMenuState extends VizelBlockMenuOpenDetail {
  x: number;
  y: number;
}

const props = defineProps<VizelBlockMenuProps>();

const effectiveActions = computed(
  () =>
    props.actions ??
    (props.locale ? createVizelBlockMenuActions(props.locale) : vizelDefaultBlockMenuActions)
);
const effectiveNodeTypes = computed(
  () =>
    props.nodeTypes ?? (props.locale ? createVizelNodeTypes(props.locale) : vizelDefaultNodeTypes)
);

const menuState = shallowRef<BlockMenuState | null>(null);
const showTurnInto = ref(false);
const menuRef = ref<HTMLDivElement | null>(null);
const submenuRef = ref<HTMLDivElement | null>(null);

const groups = computed(() =>
  menuState.value ? groupVizelBlockMenuActions(effectiveActions.value) : []
);

const turnIntoOptions = computed(() =>
  menuState.value ? getVizelTurnIntoOptions(menuState.value.editor, effectiveNodeTypes.value) : []
);

function close() {
  const editor = menuState.value?.editor;
  menuState.value = null;
  showTurnInto.value = false;
  editor?.view.dom.focus();
}

function handleAction(action: VizelBlockMenuAction) {
  if (!menuState.value) return;
  action.run(menuState.value.editor, menuState.value.pos, menuState.value.node);
  close();
}

function handleTurnInto(nodeType: VizelNodeTypeOption) {
  if (!menuState.value) return;
  const { editor, pos } = menuState.value;
  editor.chain().focus().setNodeSelection(pos).run();
  nodeType.command(editor);
  close();
}

function handleOpen(e: Event) {
  if (!(e instanceof CustomEvent)) return;
  const detail = e.detail as VizelBlockMenuOpenDetail;
  menuState.value = {
    ...detail,
    x: detail.handleRect.left,
    y: detail.handleRect.bottom + 4,
  };
  showTurnInto.value = false;
}

function handleMenuKeyDown(e: KeyboardEvent) {
  if (!menuRef.value) return;

  const items = Array.from(
    menuRef.value.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
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
watch(menuState, (state) => {
  if (state) {
    void nextTick(() => {
      const firstItem = menuRef.value?.querySelector<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])'
      );
      firstItem?.focus();
    });
  }
});

let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
let escapeHandler: ((e: KeyboardEvent) => void) | null = null;

function addCloseListeners() {
  removeCloseListeners();

  outsideClickHandler = (e: MouseEvent) => {
    if (!(e.target instanceof Node)) return;
    if (
      menuRef.value &&
      !menuRef.value.contains(e.target) &&
      !submenuRef.value?.contains(e.target)
    ) {
      close();
    }
  };

  escapeHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };

  if (outsideClickHandler) {
    document.addEventListener("mousedown", outsideClickHandler);
  }
  if (escapeHandler) {
    document.addEventListener("keydown", escapeHandler);
  }
}

function removeCloseListeners() {
  if (outsideClickHandler) {
    document.removeEventListener("mousedown", outsideClickHandler);
    outsideClickHandler = null;
  }
  if (escapeHandler) {
    document.removeEventListener("keydown", escapeHandler);
    escapeHandler = null;
  }
}

// Watch menuState to manage close listeners
watch(
  menuState,
  (state) => {
    if (state) {
      addCloseListeners();
    } else {
      removeCloseListeners();
    }
  },
  { flush: "post" }
);

onMounted(() => {
  document.addEventListener(VIZEL_BLOCK_MENU_EVENT, handleOpen);
});

onBeforeUnmount(() => {
  document.removeEventListener(VIZEL_BLOCK_MENU_EVENT, handleOpen);
  removeCloseListeners();
});
</script>

<template>
  <div
    v-if="menuState"
    ref="menuRef"
    :class="['vizel-block-menu', $props.class]"
    :style="{ left: menuState.x + 'px', top: menuState.y + 'px' }"
    role="menu"
    :aria-label="props.locale?.blockMenu.label ?? 'Block menu'"
    data-vizel-block-menu
    tabindex="-1"
    @keydown="handleMenuKeyDown"
  >
    <template v-for="(group, groupIndex) in groups" :key="groupIndex">
      <div v-if="groupIndex > 0" class="vizel-block-menu-divider" />
      <button
        v-for="action in group"
        :key="action.id"
        type="button"
        :class="['vizel-block-menu-item', { 'is-destructive': action.id === 'delete' }]"
        role="menuitem"
        :disabled="action.isEnabled ? !action.isEnabled(menuState.editor, menuState.node) : false"
        @click="handleAction(action)"
      >
        <span class="vizel-block-menu-item-icon">
          <VizelIcon :name="action.icon" />
        </span>
        <span class="vizel-block-menu-item-label">{{ action.label }}</span>
        <span v-if="action.shortcut" class="vizel-block-menu-item-shortcut">{{ action.shortcut }}</span>
      </button>
    </template>

    <!-- Turn into submenu trigger -->
    <div class="vizel-block-menu-divider" />
    <button
      type="button"
      class="vizel-block-menu-item vizel-block-menu-submenu-trigger"
      role="menuitem"
      aria-haspopup="menu"
      :aria-expanded="showTurnInto"
      @mouseenter="showTurnInto = true"
      @click="showTurnInto = !showTurnInto"
    >
      <span class="vizel-block-menu-item-icon">
        <VizelIcon name="arrowRightLeft" />
      </span>
      <span class="vizel-block-menu-item-label">{{ props.locale?.blockMenu.turnInto ?? 'Turn into' }}</span>
    </button>

    <!-- Turn into submenu -->
    <div
      v-if="showTurnInto && turnIntoOptions.length > 0"
      ref="submenuRef"
      class="vizel-block-menu-submenu"
      role="menu"
      :aria-label="props.locale?.blockMenu.turnInto ?? 'Turn into'"
    >
      <button
        v-for="nodeType in turnIntoOptions"
        :key="nodeType.name"
        type="button"
        class="vizel-block-menu-item"
        role="menuitem"
        @click="handleTurnInto(nodeType)"
      >
        <span class="vizel-block-menu-item-icon">
          <VizelIcon :name="nodeType.icon" />
        </span>
        <span class="vizel-block-menu-item-label">{{ nodeType.label }}</span>
      </button>
    </div>
  </div>
</template>
