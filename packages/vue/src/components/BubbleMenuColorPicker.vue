<script setup lang="ts">
import { type ColorDefinition, type Editor, HIGHLIGHT_COLORS, TEXT_COLORS } from "@vizel/core";
import { computed, onMounted, onUnmounted, ref } from "vue";

export interface BubbleMenuColorPickerProps {
  /** The editor instance */
  editor: Editor;
  /** Color picker type */
  type: "textColor" | "highlight";
  /** Custom color palette */
  colors?: ColorDefinition[];
  /** Custom class name */
  class?: string;
}

const props = defineProps<BubbleMenuColorPickerProps>();

const isOpen = ref(false);
const containerRef = ref<HTMLDivElement | null>(null);

const colorPalette = computed(() => {
  return props.colors ?? (props.type === "textColor" ? TEXT_COLORS : HIGHLIGHT_COLORS);
});

const currentColor = computed(() => {
  if (props.type === "textColor") {
    return props.editor.getAttributes("textStyle").color;
  }
  return props.editor.getAttributes("highlight").color;
});

const isTextColor = computed(() => props.type === "textColor");

function handleColorSelect(color: string) {
  if (props.type === "textColor") {
    if (color === "inherit") {
      props.editor.chain().focus().unsetColor().run();
    } else {
      props.editor.chain().focus().setColor(color).run();
    }
  } else if (color === "transparent") {
    props.editor.chain().focus().unsetHighlight().run();
  } else {
    props.editor.chain().focus().toggleHighlight({ color }).run();
  }
  isOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});

function getSwatchStyle(color: string) {
  return {
    backgroundColor: color === "inherit" ? "transparent" : color,
  };
}

function getTriggerStyle() {
  if (isTextColor.value) {
    return { color: currentColor.value || "inherit" };
  }
  return { "--highlight-color": currentColor.value || "transparent" };
}
</script>

<template>
  <div
    ref="containerRef"
    :class="['vizel-color-picker', $props.class]"
    :data-type="props.type"
  >
    <button
      type="button"
      :class="['vizel-bubble-menu-button', 'vizel-color-picker-trigger', { 'has-color': currentColor }]"
      :title="isTextColor ? 'Text Color' : 'Highlight'"
      :data-action="props.type"
      :style="getTriggerStyle()"
      @click="isOpen = !isOpen"
    >
      <template v-if="isTextColor">A</template>
      <span v-else class="vizel-color-picker-highlight-icon">
        <span class="vizel-color-picker-highlight-bar" />
      </span>
    </button>

    <div v-if="isOpen" class="vizel-color-picker-dropdown">
      <div class="vizel-color-picker-grid">
        <button
          v-for="colorDef in colorPalette"
          :key="colorDef.color"
          type="button"
          :class="['vizel-color-picker-swatch', { 'is-active': currentColor === colorDef.color }]"
          :title="colorDef.name"
          :style="getSwatchStyle(colorDef.color)"
          :data-color="colorDef.color"
          @click="handleColorSelect(colorDef.color)"
        >
          <span
            v-if="colorDef.color === 'inherit' || colorDef.color === 'transparent'"
            class="vizel-color-picker-none"
          >×</span>
        </button>
      </div>
    </div>
  </div>
</template>
