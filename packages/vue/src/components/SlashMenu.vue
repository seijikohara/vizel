<script setup lang="ts">
import type { SlashCommandItem } from "@vizel/core";
import { ref, useSlots, watch } from "vue";

const props = defineProps<{
  items: SlashCommandItem[];
  class?: string;
}>();

const emit = defineEmits<{
  command: [item: SlashCommandItem];
}>();

const slots = useSlots();
const selectedIndex = ref(0);

// Reset selection when items change
watch(
  () => props.items,
  () => {
    selectedIndex.value = 0;
  }
);

function selectItem(index: number) {
  const item = props.items[index];
  if (item) {
    emit("command", item);
  }
}

function handleKeyDown(event: KeyboardEvent): boolean {
  if (event.key === "ArrowUp") {
    selectedIndex.value = (selectedIndex.value + props.items.length - 1) % props.items.length;
    return true;
  }

  if (event.key === "ArrowDown") {
    selectedIndex.value = (selectedIndex.value + 1) % props.items.length;
    return true;
  }

  if (event.key === "Enter") {
    selectItem(selectedIndex.value);
    return true;
  }

  return false;
}

// Expose handleKeyDown for parent components
defineExpose({
  onKeyDown: handleKeyDown,
});
</script>

<template>
  <div
    :class="['vizel-slash-menu', $props.class]"
    data-vizel-slash-menu
  >
    <template v-if="items.length === 0">
      <slot v-if="slots.empty" name="empty" />
      <SlashMenuEmpty v-else />
    </template>
    <template v-else>
      <template v-for="(item, index) in items" :key="item.title">
        <slot
          v-if="slots.item"
          name="item"
          :item="item"
          :is-selected="index === selectedIndex"
          :on-click="() => selectItem(index)"
        />
        <SlashMenuItem
          v-else
          :item="item"
          :is-selected="index === selectedIndex"
          @click="selectItem(index)"
        />
      </template>
    </template>
  </div>
</template>
