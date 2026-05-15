<script setup lang="ts">
import { resolveVizelListNavigation, type VizelLocale, type VizelMentionItem } from "@vizel/core";
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

const activeOptionId = computed(() => {
  const item = props.items[selectedIndex.value];
  return item ? `vizel-mention-${item.id}` : undefined;
});

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
    role="listbox"
    :aria-label="props.locale?.mentionMenu?.ariaLabel ?? 'Mentions'"
    :aria-activedescendant="activeOptionId"
  >
    <div v-if="items.length === 0" class="vizel-mention-menu-empty">
      {{ props.locale?.mentionMenu?.noResults ?? 'No results' }}
    </div>
    <template v-else>
      <div
        v-for="(item, index) in items"
        :key="item.id"
        :id="`vizel-mention-${item.id}`"
        :ref="(el) => { itemRefs[index] = el as HTMLElement | null }"
        :class="['vizel-mention-menu-item', { 'is-selected': index === selectedIndex }]"
        role="option"
        :aria-selected="index === selectedIndex"
        :tabindex="-1"
        @click="selectItem(index)"
        @keydown.enter="selectItem(index)"
      >
        <div class="vizel-mention-menu-item-avatar">
          <img v-if="item.avatar" :src="item.avatar" :alt="item.label" />
          <template v-else>{{ item.label.charAt(0).toUpperCase() }}</template>
        </div>
        <div class="vizel-mention-menu-item-content">
          <div class="vizel-mention-menu-item-label">{{ item.label }}</div>
          <div v-if="item.description" class="vizel-mention-menu-item-description">
            {{ item.description }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
