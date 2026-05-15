<script setup lang="ts">
import {
  buildVizelMentionMenuSkeleton,
  resolveVizelListNavigation,
  type VizelLocale,
  type VizelMentionItem,
} from "@vizel/core";
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

const props = defineProps<VizelMentionMenuProps>();

const emit = defineEmits<{
  select: [item: VizelMentionItem];
}>();

const selectedIndex = ref(0);
const itemRefs = ref<(HTMLElement | null)[]>([]);

const spec = computed(() =>
  buildVizelMentionMenuSkeleton(props.items, selectedIndex.value, props.locale)
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
    selectItem(selectedIndex.value);
    return true;
  }
  const next = resolveVizelListNavigation(event.key, selectedIndex.value, props.items.length);
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
    <div v-if="spec.sections.length === 0" class="vizel-mention-menu-empty">
      {{ props.locale?.mentionMenu?.noResults ?? 'No results' }}
    </div>
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
      </div>
    </template>
  </div>
</template>
