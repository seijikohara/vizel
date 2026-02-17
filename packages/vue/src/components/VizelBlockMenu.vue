<script setup lang="ts">
import {
  getVizelTurnIntoOptions,
  groupVizelBlockMenuActions,
  VIZEL_BLOCK_MENU_EVENT,
  type VizelBlockMenuAction,
  type VizelBlockMenuOpenDetail,
  type VizelNodeTypeOption,
  vizelDefaultBlockMenuActions,
  vizelDefaultNodeTypes,
} from "@vizel/core";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import VizelIcon from "./VizelIcon.vue";

export interface VizelBlockMenuProps {
  /** Custom block menu actions (replaces defaults) */
  actions?: VizelBlockMenuAction[];
  /** Custom node types for "Turn into" submenu */
  nodeTypes?: VizelNodeTypeOption[];
  /** Additional class name */
  class?: string;
}

interface BlockMenuState extends VizelBlockMenuOpenDetail {
  x: number;
  y: number;
}

const props = withDefaults(defineProps<VizelBlockMenuProps>(), {
  actions: () => vizelDefaultBlockMenuActions,
  nodeTypes: () => vizelDefaultNodeTypes,
});

const menuState = shallowRef<BlockMenuState | null>(null);
const showTurnInto = ref(false);
const menuRef = ref<HTMLDivElement | null>(null);
const submenuRef = ref<HTMLDivElement | null>(null);

const groups = computed(() => (menuState.value ? groupVizelBlockMenuActions(props.actions) : []));

const turnIntoOptions = computed(() =>
  menuState.value ? getVizelTurnIntoOptions(menuState.value.editor, props.nodeTypes) : []
);

function close() {
  menuState.value = null;
  showTurnInto.value = false;
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
  const detail = (e as CustomEvent<VizelBlockMenuOpenDetail>).detail;
  menuState.value = {
    ...detail,
    x: detail.handleRect.left,
    y: detail.handleRect.bottom + 4,
  };
  showTurnInto.value = false;
}

let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
let escapeHandler: ((e: KeyboardEvent) => void) | null = null;

function addCloseListeners() {
  removeCloseListeners();

  outsideClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      menuRef.value &&
      !menuRef.value.contains(target) &&
      !(submenuRef.value && submenuRef.value.contains(target))
    ) {
      close();
    }
  };

  escapeHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };

  document.addEventListener("mousedown", outsideClickHandler!);
  document.addEventListener("keydown", escapeHandler!);
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
    aria-label="Block menu"
    data-vizel-block-menu
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
      aria-haspopup="true"
      :aria-expanded="showTurnInto"
      @mouseenter="showTurnInto = true"
      @click="showTurnInto = !showTurnInto"
    >
      <span class="vizel-block-menu-item-icon">
        <VizelIcon name="arrowRightLeft" />
      </span>
      <span class="vizel-block-menu-item-label">Turn into</span>
    </button>

    <!-- Turn into submenu -->
    <div
      v-if="showTurnInto && turnIntoOptions.length > 0"
      ref="submenuRef"
      class="vizel-block-menu-submenu"
      role="menu"
      aria-label="Turn into"
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
