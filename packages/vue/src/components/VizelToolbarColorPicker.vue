<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import {
  addVizelRecentColor,
  getVizelRecentColors,
  VIZEL_HIGHLIGHT_COLORS,
  VIZEL_TEXT_COLORS,
  type VizelColorDefinition,
} from "@vizel/core";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import VizelColorPicker from "./VizelColorPicker.vue";
import VizelIcon from "./VizelIcon.vue";

export interface VizelToolbarColorPickerProps {
  /** The editor instance */
  editor: Editor;
  /** Color picker type */
  type: "textColor" | "highlight";
  /** Custom color palette */
  colors?: VizelColorDefinition[];
  /** Custom class name */
  class?: string;
  /** Enable custom color input (default: true) */
  allowCustomColor?: boolean;
  /** Enable recent colors (default: true) */
  showRecentColors?: boolean;
}

const props = withDefaults(defineProps<VizelToolbarColorPickerProps>(), {
  allowCustomColor: true,
  showRecentColors: true,
});

const isOpen = ref(false);
const recentColors = ref<string[]>([]);
const containerRef = ref<HTMLDivElement | null>(null);

const colorPalette = computed(() => {
  return props.colors ?? (props.type === "textColor" ? VIZEL_TEXT_COLORS : VIZEL_HIGHLIGHT_COLORS);
});

const currentColor = computed(() => {
  if (props.type === "textColor") {
    return props.editor.getAttributes("textStyle").color;
  }
  return props.editor.getAttributes("highlight").color;
});

const isTextColor = computed(() => props.type === "textColor");

const noneValues = computed(() => (isTextColor.value ? ["inherit"] : ["transparent"]));

// Load recent colors when dropdown opens
watch(isOpen, (open) => {
  if (open && props.showRecentColors) {
    recentColors.value = getVizelRecentColors(props.type);
  }
});

function handleColorChange(color: string) {
  if (props.type === "textColor") {
    if (color === "inherit") {
      props.editor.chain().focus().unsetColor().run();
    } else {
      props.editor.chain().focus().setColor(color).run();
      addVizelRecentColor(props.type, color);
    }
  } else if (color === "transparent") {
    props.editor.chain().focus().unsetHighlight().run();
  } else {
    props.editor.chain().focus().toggleHighlight({ color }).run();
    addVizelRecentColor(props.type, color);
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
      <VizelIcon v-if="isTextColor" name="textColor" />
      <VizelIcon v-else name="highlighter" />
    </button>

    <div v-if="isOpen" class="vizel-color-picker-dropdown">
      <VizelColorPicker
        :colors="colorPalette"
        :value="currentColor"
        :label="isTextColor ? 'Text color palette' : 'Highlight color palette'"
        :allow-custom-color="props.allowCustomColor ?? true"
        :recent-colors="recentColors"
        :show-recent-colors="props.showRecentColors ?? true"
        :none-values="noneValues"
        @change="handleColorChange"
      />
    </div>
  </div>
</template>
