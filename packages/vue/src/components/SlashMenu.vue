<script setup lang="ts">
import { groupSlashCommands, type SlashCommandGroup, type SlashCommandItem } from "@vizel/core";
import { computed, nextTick, ref, useSlots, watch } from "vue";
import SlashMenuEmpty from "./SlashMenuEmpty.vue";
import SlashMenuItem from "./SlashMenuItem.vue";

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export interface SlashMenuProps {
  /** The list of slash command items */
  items: SlashCommandItem[];
  /** Custom class name */
  class?: string;
  /** Whether to show items grouped by category (default: true when not searching) */
  showGroups?: boolean;
  /** Custom group order */
  groupOrder?: string[];
}

const props = withDefaults(defineProps<SlashMenuProps>(), {
  showGroups: true,
});

const emit = defineEmits<{
  command: [item: SlashCommandItem];
}>();

const slots = useSlots();
const selectedIndex = ref(0);
const itemRefs = ref<(HTMLElement | null)[]>([]);

// Group items when showGroups is true and there are enough items
const groups = computed<SlashCommandGroup[]>(() => {
  if (!props.showGroups || props.items.length <= 5) {
    // Don't group if explicitly disabled or few items (likely search results)
    return [{ name: "", items: props.items }];
  }
  return groupSlashCommands(props.items, props.groupOrder);
});

// Flatten for navigation
const flatItems = computed(() => groups.value.flatMap((g) => g.items));

// Reset selection and refs when items change
watch(
  () => props.items,
  () => {
    selectedIndex.value = 0;
    // Reset refs array to prevent stale references
    itemRefs.value = [];
  }
);

// Scroll selected item into view when selection changes
watch(selectedIndex, async (newIndex) => {
  await nextTick();
  const selectedElement = itemRefs.value[newIndex];
  if (selectedElement) {
    selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
});

function selectItem(index: number) {
  const item = flatItems.value[index];
  if (item) {
    emit("command", item);
  }
}

// Navigate to next group with Tab
function tabHandler() {
  if (groups.value.length <= 1) return;

  let currentGroupIndex = 0;
  let itemCount = 0;
  for (let i = 0; i < groups.value.length; i++) {
    const group = groups.value[i];
    if (!group) continue;
    if (selectedIndex.value < itemCount + group.items.length) {
      currentGroupIndex = i;
      break;
    }
    itemCount += group.items.length;
  }

  // Move to next group
  const nextGroupIndex = (currentGroupIndex + 1) % groups.value.length;
  let nextIndex = 0;
  for (let i = 0; i < nextGroupIndex; i++) {
    const group = groups.value[i];
    if (group) {
      nextIndex += group.items.length;
    }
  }
  selectedIndex.value = nextIndex;
}

function handleKeyDown(event: KeyboardEvent): boolean {
  if (event.key === "ArrowUp") {
    selectedIndex.value =
      (selectedIndex.value + flatItems.value.length - 1) % flatItems.value.length;
    return true;
  }

  if (event.key === "ArrowDown") {
    selectedIndex.value = (selectedIndex.value + 1) % flatItems.value.length;
    return true;
  }

  if (event.key === "Enter") {
    selectItem(selectedIndex.value);
    return true;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    tabHandler();
    return true;
  }

  return false;
}

// Expose handleKeyDown for parent components
defineExpose({
  onKeyDown: handleKeyDown,
});

// Calculate global index for items
function getGlobalIndex(groupIndex: number, itemIndex: number): number {
  let index = 0;
  for (let i = 0; i < groupIndex; i++) {
    const group = groups.value[i];
    if (group) {
      index += group.items.length;
    }
  }
  return index + itemIndex;
}
</script>

<template>
  <div :class="['vizel-slash-menu', $props.class]" data-vizel-slash-menu>
    <template v-if="flatItems.length === 0">
      <slot v-if="slots.empty" name="empty" />
      <SlashMenuEmpty v-else />
    </template>
    <template v-else>
      <template v-for="(group, groupIndex) in groups" :key="group.name || groupIndex">
        <!-- Group with header -->
        <div
          v-if="group.name"
          class="vizel-slash-menu-group"
          data-vizel-slash-menu-group
        >
          <div class="vizel-slash-menu-group-header">{{ group.name }}</div>
          <div
            v-for="(item, itemIndex) in group.items"
            :key="item.title"
            :ref="(el) => (itemRefs[getGlobalIndex(groupIndex, itemIndex)] = el as HTMLElement)"
          >
            <slot
              v-if="slots.item"
              name="item"
              :item="item"
              :is-selected="getGlobalIndex(groupIndex, itemIndex) === selectedIndex"
              :on-click="() => selectItem(getGlobalIndex(groupIndex, itemIndex))"
            />
            <SlashMenuItem
              v-else
              :item="item"
              :is-selected="getGlobalIndex(groupIndex, itemIndex) === selectedIndex"
              @click="selectItem(getGlobalIndex(groupIndex, itemIndex))"
            />
          </div>
        </div>
        <!-- Items without group header -->
        <template v-else>
          <div
            v-for="(item, itemIndex) in group.items"
            :key="item.title"
            :ref="(el) => (itemRefs[getGlobalIndex(groupIndex, itemIndex)] = el as HTMLElement)"
          >
            <slot
              v-if="slots.item"
              name="item"
              :item="item"
              :is-selected="getGlobalIndex(groupIndex, itemIndex) === selectedIndex"
              :on-click="() => selectItem(getGlobalIndex(groupIndex, itemIndex))"
            />
            <SlashMenuItem
              v-else
              :item="item"
              :is-selected="getGlobalIndex(groupIndex, itemIndex) === selectedIndex"
              @click="selectItem(getGlobalIndex(groupIndex, itemIndex))"
            />
          </div>
        </template>
      </template>
    </template>
  </div>
</template>
