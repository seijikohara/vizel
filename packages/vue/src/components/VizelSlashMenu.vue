<script setup lang="ts">
import {
  buildVizelSlashMenuSpec,
  getNextVizelSlashMenuGroupIndex,
  type VizelSlashCommandItem,
} from "@vizel/core";
import { buildVizelComboboxKeySpec } from "@vizel/headless/combobox";
import { computed, nextTick, ref, watch } from "vue";
import VizelSlashMenuEmpty from "./VizelSlashMenuEmpty.vue";
import VizelSlashMenuItem from "./VizelSlashMenuItem.vue";

/**
 * Ref interface for VizelSlashMenu component.
 * Exposes keyboard navigation handler for parent components.
 */
export interface VizelSlashMenuRef {
  /**
   * Handle keyboard navigation events (ArrowUp, ArrowDown, Enter, Tab).
   * Accepts a raw `KeyboardEvent`; cross-framework parity with React/Svelte
   * was previously broken by a `{ event }` wrapper in the type declaration
   * that never matched the underlying `defineExpose` shape.
   */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface VizelSlashMenuProps {
  /** The list of slash command items */
  items: VizelSlashCommandItem[];
  /** Custom class name */
  class?: string;
  /** Whether to show items grouped by category (default: true when not searching) */
  showGroups?: boolean;
  /** Custom group order */
  groupOrder?: string[];
}

/**
 * Props passed to the `#item` scoped slot.
 *
 * The callback prop uses the lowercase `onclick` name to stay consistent
 * with `VizelMentionMenu`'s `#item` slot and the Svelte adapter's
 * `renderItem` snippet (ADR-0004). Slot props are plain object keys, not
 * DOM event bindings, so the name is a deliberate contract rather than a
 * native listener.
 */
export interface VizelSlashMenuItemSlotProps {
  /** The slash command item to render */
  item: VizelSlashCommandItem;
  /** Whether the item is the active keyboard selection */
  isSelected: boolean;
  /** Invoke the item's command */
  onclick: () => void;
}

const props = withDefaults(defineProps<VizelSlashMenuProps>(), {
  showGroups: true,
});

const emit = defineEmits<{
  select: [item: VizelSlashCommandItem];
}>();

const slots = defineSlots<{
  /** Replace the default empty-state markup shown when no item matches. */
  empty?: () => unknown;
  /** Replace the per-item markup; the container, keyboard, and ARIA wiring stay owned by VizelSlashMenu. */
  item?: (props: VizelSlashMenuItemSlotProps) => unknown;
}>();
const selectedIndex = ref(0);
const itemRefs = ref<(HTMLElement | null)[]>([]);

const spec = computed(() =>
  buildVizelSlashMenuSpec(props.items, selectedIndex.value, {
    showGroups: props.showGroups,
    ...(props.groupOrder && { groupOrder: props.groupOrder }),
  })
);

const flatItemCount = computed(() =>
  spec.value.sections.reduce((sum, section) => sum + section.items.length, 0)
);

watch(
  () => props.items,
  () => {
    selectedIndex.value = 0;
    itemRefs.value = [];
  }
);

watch(selectedIndex, async (newIndex) => {
  await nextTick();
  const selectedElement = itemRefs.value[newIndex];
  if (selectedElement) {
    selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
});

function selectItem(index: number) {
  const slot = spec.value.sections
    .flatMap((section) => section.items)
    .find((s) => s.index === index);
  if (slot) {
    emit("select", slot.data.item);
  }
}

function handleKeyDown(event: KeyboardEvent): boolean {
  // The combobox resolver returns `null` for unknown keys *and* for
  // `count === 0`, so the empty-menu case falls through and lets Tiptap
  // consume the key. `groupNext` (Tab) carries the slash-only group jump;
  // `close` (Escape) is reported unhandled because the menu has no own
  // close path — Tiptap dismisses it.
  const action = buildVizelComboboxKeySpec({
    key: event.key,
    currentIndex: selectedIndex.value,
    length: flatItemCount.value,
  });
  if (action === null) return false;
  switch (action.type) {
    case "navigate":
      selectedIndex.value = action.index;
      return true;
    case "select":
      selectItem(action.index);
      return true;
    case "groupNext":
      event.preventDefault();
      selectedIndex.value = getNextVizelSlashMenuGroupIndex(spec.value, selectedIndex.value);
      return true;
    default:
      return false;
  }
}

defineExpose({
  onKeyDown: handleKeyDown,
});
</script>

<template>
  <div
    :class="['vizel-slash-menu', $props.class]"
    data-vizel-slash-menu
    :role="spec.root.role"
    :aria-label="spec.root['aria-label']"
    :aria-activedescendant="spec.root['aria-activedescendant']"
  >
    <template v-if="spec.sections.length === 0">
      <slot v-if="slots.empty" name="empty" />
      <VizelSlashMenuEmpty v-else />
    </template>
    <template v-else>
      <template v-for="section in spec.sections" :key="section.key">
        <!-- Section with header -->
        <div
          v-if="section.header"
          class="vizel-slash-menu-group"
          data-vizel-slash-menu-group
        >
          <div class="vizel-slash-menu-group-header">{{ section.header.label }}</div>
          <div
            v-for="slot in section.items"
            :key="slot.key"
            :ref="(el) => (itemRefs[slot.index] = el as HTMLElement)"
          >
            <slot
              v-if="slots.item"
              name="item"
              :item="slot.data.item"
              :is-selected="slot.data.isSelected"
              :onclick="() => selectItem(slot.index)"
            />
            <VizelSlashMenuItem
              v-else
              :id="slot.attrs.id"
              :item="slot.data.item"
              :is-selected="slot.data.isSelected"
              @click="selectItem(slot.index)"
            />
          </div>
        </div>
        <!-- Items without section header -->
        <template v-else>
          <div
            v-for="slot in section.items"
            :key="slot.key"
            :ref="(el) => (itemRefs[slot.index] = el as HTMLElement)"
          >
            <slot
              v-if="slots.item"
              name="item"
              :item="slot.data.item"
              :is-selected="slot.data.isSelected"
              :onclick="() => selectItem(slot.index)"
            />
            <VizelSlashMenuItem
              v-else
              :id="slot.attrs.id"
              :item="slot.data.item"
              :is-selected="slot.data.isSelected"
              @click="selectItem(slot.index)"
            />
          </div>
        </template>
      </template>
    </template>
  </div>
</template>
