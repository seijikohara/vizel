<script setup lang="ts">
import { buildVizelMentionMenuSpec, type VizelLocale, type VizelMentionItem } from "@vizel/core";
import { buildVizelListNavSpec } from "@vizel/headless/keyboard";
import { computed, nextTick, ref, watch } from "vue";

export interface VizelMentionMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface VizelMentionMenuProps {
  items: VizelMentionItem[];
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * Props passed to the `#item` scoped slot.
 *
 * The callback prop uses the lowercase `onclick` name to stay consistent
 * with `VizelSlashMenu`'s `#item` slot and the Svelte adapter's
 * `renderItem` snippet (ADR-0004). Slot props are plain object keys, not
 * DOM event bindings, so the name is a deliberate contract rather than a
 * native listener.
 */
export interface VizelMentionMenuItemSlotProps {
  /** The mention item to render */
  item: VizelMentionItem;
  /** Whether the item is the active keyboard selection */
  isSelected: boolean;
  /** Invoke the item's selection */
  onclick: () => void;
}

const props = defineProps<VizelMentionMenuProps>();

const emit = defineEmits<{
  select: [item: VizelMentionItem];
}>();

defineSlots<{
  /** Replace the default no-results markup shown when no item matches. */
  empty?: () => unknown;
  /** Replace the per-item markup; the container, keyboard, and ARIA wiring stay owned by VizelMentionMenu. */
  item?: (props: VizelMentionMenuItemSlotProps) => unknown;
}>();

const selectedIndex = ref(0);
const itemRefs = ref<(HTMLElement | null)[]>([]);

const spec = computed(() =>
  buildVizelMentionMenuSpec(props.items, selectedIndex.value, props.locale)
);

const slots = computed(() => spec.value.sections.flatMap((section) => section.items));

watch(
  () => props.items,
  () => {
    selectedIndex.value = 0;
    itemRefs.value = new Array(props.items.length).fill(null);
  }
);

function scrollToSelected() {
  void nextTick(() => {
    const el = itemRefs.value[selectedIndex.value];
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

function selectItem(index: number) {
  const item = props.items[index];
  if (item) {
    emit("select", item);
  }
}

function onKeyDown(event: KeyboardEvent): boolean {
  if (event.key === "Enter") {
    if (props.items.length === 0) return false;
    selectItem(selectedIndex.value);
    return true;
  }
  const next = buildVizelListNavSpec({
    key: event.key,
    currentIndex: selectedIndex.value,
    length: props.items.length,
  });
  if (next === null) return false;
  selectedIndex.value = next;
  scrollToSelected();
  return true;
}

defineExpose<VizelMentionMenuRef>({ onKeyDown });
</script>

<template>
  <div
    :class="['vizel-mention-menu', props.class]"
    data-vizel-mention-menu
    :role="spec.root.role"
    :aria-label="spec.root['aria-label']"
    :aria-activedescendant="spec.root['aria-activedescendant']"
  >
    <template v-if="spec.sections.length === 0">
      <!--
        Mirrors VizelSlashMenu's `#empty` slot — consumers swap the
        no-results affordance without re-implementing keyboard / ARIA
        wiring.
      -->
      <slot name="empty">
        <div class="vizel-mention-menu-empty">
          {{ props.locale?.mentionMenu?.noResults ?? 'No results' }}
        </div>
      </slot>
    </template>
    <template v-else>
      <div
        v-for="slot in slots"
        :key="slot.key"
        :id="slot.attrs.id"
        :ref="(el) => { itemRefs[slot.index] = el as HTMLElement | null }"
        :class="['vizel-mention-menu-item', { 'is-selected': slot.data.isSelected }]"
        :role="slot.attrs.role"
        :aria-selected="slot.attrs['aria-selected']"
        :tabindex="slot.attrs.tabIndex"
        @click="selectItem(slot.index)"
        @keydown.enter="selectItem(slot.index)"
      >
        <!--
          Item slot mirrors VizelSlashMenu's `#item` seam. The container,
          keyboard navigation, ARIA, and click handling stay owned by
          VizelMentionMenu; consumers only swap the per-item markup.
        -->
        <slot
          name="item"
          :item="slot.data.item"
          :is-selected="slot.data.isSelected"
          :onclick="() => selectItem(slot.index)"
        >
          <div class="vizel-mention-menu-item-avatar">
            <img v-if="slot.data.item.avatar" :src="slot.data.item.avatar" :alt="slot.data.item.label" />
            <template v-else>{{ slot.data.item.label.charAt(0).toUpperCase() }}</template>
          </div>
          <div class="vizel-mention-menu-item-content">
            <div class="vizel-mention-menu-item-label">{{ slot.data.item.label }}</div>
            <div v-if="slot.data.item.description" class="vizel-mention-menu-item-description">
              {{ slot.data.item.description }}
            </div>
          </div>
        </slot>
      </div>
    </template>
  </div>
</template>
