<script setup lang="ts">
import {
  buildVizelBlockMenuSpec,
  clampMenuPosition,
  createVizelBlockMenuActions,
  createVizelBlockMenuTriggerController,
  createVizelNodeTypes,
  type Editor,
  getVizelTurnIntoOptions,
  shouldFlipSubmenu,
  type VizelBlockMenuAction,
  type VizelBlockMenuOpenDetail,
  type VizelLocale,
  type VizelNodeTypeOption,
  vizelDefaultBlockMenuActions,
  vizelDefaultNodeTypes,
} from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { useVizelContextSafe } from "./VizelContext.ts";
import VizelIcon from "./VizelIcon.vue";

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

interface BlockMenuState extends VizelBlockMenuOpenDetail {
  x: number;
  y: number;
}

const props = defineProps<VizelBlockMenuProps>();

const contextEditor = useVizelContextSafe();
const boundEditor = computed<Editor | null>(() => props.editor ?? contextEditor?.value ?? null);

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
const submenuFlipped = ref(false);
const menuRef = ref<HTMLDivElement | null>(null);
const submenuRef = ref<HTMLDivElement | null>(null);

const turnIntoOptions = computed(() =>
  menuState.value ? getVizelTurnIntoOptions(menuState.value.editor, effectiveNodeTypes.value) : []
);

const spec = computed(() =>
  buildVizelBlockMenuSpec(
    effectiveActions.value,
    turnIntoOptions.value,
    showTurnInto.value,
    props.locale
  )
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

watch(showTurnInto, (isOpen) => {
  if (!(isOpen && menuRef.value)) {
    submenuFlipped.value = false;
    return;
  }
  void nextTick(() => {
    const parentRect = menuRef.value?.getBoundingClientRect();
    if (parentRect) {
      submenuFlipped.value = shouldFlipSubmenu(parentRect, 200);
    }
  });
});

// The submenu lives inside `menuRef`, so a single mount target covers both
// surfaces for outside-pointer detection. Escape keeps v1's semantics (close
// without preventDefault), so `captureEscape` stays off.
const dismissable = createVizelDismissable({
  onPointerOutside: close,
  onEscape: close,
});

watch(
  [menuState, menuRef],
  ([state, menu]) => {
    if (state && menu) {
      dismissable.mount(menu);
    } else {
      dismissable.unmount();
    }
  },
  { flush: "post" }
);

// The drag-handle extension dispatches `VIZEL_BLOCK_MENU_EVENT` on
// `document`; the trigger controller owns that subscription so this
// component never attaches the listener directly (ADR-0007).
const triggerController = createVizelBlockMenuTriggerController({
  onOpen: (detail: VizelBlockMenuOpenDetail) => {
    if (boundEditor.value && detail.editor !== boundEditor.value) return;
    menuState.value = {
      ...detail,
      x: detail.handleRect.left,
      y: detail.handleRect.bottom + 4,
    };
    showTurnInto.value = false;

    void nextTick(() => {
      const el = menuRef.value;
      if (!(el && menuState.value)) return;
      const clamped = clampMenuPosition(detail.handleRect, el.offsetWidth, el.offsetHeight);
      menuState.value = { ...menuState.value, x: clamped.x, y: clamped.y };
    });
  },
});

onMounted(() => {
  triggerController.mount();
});

onBeforeUnmount(() => {
  triggerController.unmount();
  dismissable.unmount();
});
</script>

<template>
  <div
    v-if="menuState"
    ref="menuRef"
    :class="['vizel-block-menu', $props.class]"
    :style="{ left: menuState.x + 'px', top: menuState.y + 'px' }"
    :role="spec.root.role"
    :aria-label="spec.root['aria-label']"
    data-vizel-block-menu
    :tabindex="spec.root.tabIndex"
    @keydown="handleMenuKeyDown"
  >
    <template v-for="(section, sectionIndex) in spec.sections" :key="section.key">
      <div v-if="sectionIndex > 0" class="vizel-block-menu-divider" />
      <button
        v-for="slot in section.items"
        :key="slot.key"
        type="button"
        :class="['vizel-block-menu-item', { 'is-destructive': slot.data.isDestructive }]"
        :role="slot.attrs.role"
        :disabled="slot.data.action.isEnabled ? !slot.data.action.isEnabled(menuState.editor, menuState.node) : false"
        @click="handleAction(slot.data.action)"
      >
        <span class="vizel-block-menu-item-icon">
          <VizelIcon :name="slot.data.action.icon" />
        </span>
        <span class="vizel-block-menu-item-label">{{ slot.data.action.label }}</span>
        <span v-if="slot.data.action.shortcut" class="vizel-block-menu-item-shortcut">{{ slot.data.action.shortcut }}</span>
      </button>
    </template>

    <!-- Turn into submenu trigger -->
    <div class="vizel-block-menu-divider" />
    <button
      type="button"
      class="vizel-block-menu-item vizel-block-menu-submenu-trigger"
      :role="spec.submenuTrigger.attrs.role"
      :aria-haspopup="spec.submenuTrigger.attrs['aria-haspopup']"
      :aria-expanded="spec.submenuTrigger.attrs['aria-expanded']"
      @mouseenter="showTurnInto = true"
      @click="showTurnInto = !showTurnInto"
    >
      <span class="vizel-block-menu-item-icon">
        <VizelIcon :name="spec.submenuTrigger.iconName" />
      </span>
      <span class="vizel-block-menu-item-label">{{ spec.submenuTrigger.label }}</span>
    </button>

    <!-- Turn into submenu -->
    <div
      v-if="showTurnInto && spec.submenu.sections.length > 0"
      ref="submenuRef"
      :class="['vizel-block-menu-submenu', { 'vizel-block-menu-submenu--left': submenuFlipped }]"
      :role="spec.submenu.root.role"
      :aria-label="spec.submenu.root['aria-label']"
    >
      <template v-for="section in spec.submenu.sections" :key="section.key">
        <button
          v-for="slot in section.items"
          :key="slot.key"
          type="button"
          class="vizel-block-menu-item"
          :role="slot.attrs.role"
          @click="handleTurnInto(slot.data.nodeType)"
        >
          <span class="vizel-block-menu-item-icon">
            <VizelIcon :name="slot.data.nodeType.icon" />
          </span>
          <span class="vizel-block-menu-item-label">{{ slot.data.nodeType.label }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
