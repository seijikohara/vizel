<script setup lang="ts">
import type { Editor, VizelOutlineItemSpec } from "@vizel/core";

export interface VizelOutlineItemsProps {
  items: readonly VizelOutlineItemSpec[];
  editor: Editor;
}

const props = defineProps<VizelOutlineItemsProps>();

const onItemClick = (pos: number) => {
  props.editor
    .chain()
    .focus()
    .setTextSelection(pos + 1)
    .run();
};
</script>

<template>
  <!-- biome-ignore lint/a11y/useSemanticElements: WAI-ARIA tree pattern requires role="group" on nested lists inside role="tree". -->
  <ul class="vizel-outline-list" role="group">
    <li
      v-for="item in props.items"
      :key="item.key"
      role="treeitem"
      :tabindex="-1"
      :aria-level="item.level"
      :aria-selected="item.isCurrent"
      :aria-current="item.isCurrent ? 'true' : undefined"
      :class="[
        'vizel-outline-item',
        `vizel-outline-item--level-${item.level}`,
        item.isCurrent ? 'vizel-outline-item--current' : '',
      ]"
    >
      <button type="button" class="vizel-outline-link" @click="onItemClick(item.pos)">
        {{ item.label }}
      </button>
      <VizelOutlineItems
        v-if="item.children.length > 0"
        :items="item.children"
        :editor="props.editor"
      />
    </li>
  </ul>
</template>
