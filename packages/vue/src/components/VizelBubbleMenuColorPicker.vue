<script setup lang="ts">
import {
  addVizelRecentColor,
  type Editor,
  getVizelRecentColors,
  VIZEL_HIGHLIGHT_COLORS,
  VIZEL_TEXT_COLORS,
  type VizelColorDefinition,
  type VizelLocale,
} from "@vizel/core";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import VizelColorPicker from "./VizelColorPicker.vue";
import VizelIcon from "./VizelIcon.vue";

export interface VizelBubbleMenuColorPickerProps {
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
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = withDefaults(defineProps<VizelBubbleMenuColorPickerProps>(), {
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
  if (!(event.target instanceof Node)) return;
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false;
  }
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    document.removeEventListener("mousedown", handleClickOutside);
  }
});

onBeforeUnmount(() => {
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
      :title="isTextColor ? (props.locale?.colorPicker?.textColor ?? 'Text Color') : (props.locale?.colorPicker?.highlight ?? 'Highlight')"
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
        :label="isTextColor ? (props.locale?.colorPicker?.textColorPalette ?? 'Text color palette') : (props.locale?.colorPicker?.highlightPalette ?? 'Highlight color palette')"
        :allow-custom-color="props.allowCustomColor"
        :recent-colors="recentColors"
        :show-recent-colors="props.showRecentColors"
        :none-values="noneValues"
        :recent-label="props.locale?.colorPicker?.recent ?? 'Recent'"
        :hex-placeholder="props.locale?.colorPicker?.hexPlaceholder ?? '#000000'"
        :apply-title="props.locale?.colorPicker?.apply ?? 'Apply'"
        :apply-aria-label="props.locale?.colorPicker?.applyAriaLabel ?? 'Apply custom color'"
        @change="handleColorChange"
      />
    </div>
  </div>
</template>
