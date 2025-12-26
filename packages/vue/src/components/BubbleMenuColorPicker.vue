<script setup lang="ts">
import {
  addRecentColor,
  type ColorDefinition,
  type Editor,
  getRecentColors,
  HIGHLIGHT_COLORS,
  isValidHexColor,
  normalizeHexColor,
  TEXT_COLORS,
} from "@vizel/core";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

export interface BubbleMenuColorPickerProps {
  /** The editor instance */
  editor: Editor;
  /** Color picker type */
  type: "textColor" | "highlight";
  /** Custom color palette */
  colors?: ColorDefinition[];
  /** Custom class name */
  class?: string;
  /** Enable custom color input (default: true) */
  allowCustomColor?: boolean;
  /** Enable recent colors (default: true) */
  showRecentColors?: boolean;
}

const props = withDefaults(defineProps<BubbleMenuColorPickerProps>(), {
  allowCustomColor: true,
  showRecentColors: true,
});

const isOpen = ref(false);
const customColor = ref("");
const recentColors = ref<string[]>([]);
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

const isCustomColorValid = computed(() => {
  return isValidHexColor(normalizeHexColor(customColor.value));
});

// Load recent colors and set initial input value when dropdown opens
watch(isOpen, (open) => {
  if (open && props.showRecentColors) {
    recentColors.value = getRecentColors(props.type);
  }
  if (open) {
    const current = currentColor.value;
    if (current && current !== "inherit" && current !== "transparent") {
      customColor.value = current;
    } else {
      customColor.value = "";
    }
  }
});

function applyColor(color: string) {
  if (props.type === "textColor") {
    if (color === "inherit") {
      props.editor.chain().focus().unsetColor().run();
    } else {
      props.editor.chain().focus().setColor(color).run();
      addRecentColor(props.type, color);
    }
  } else if (color === "transparent") {
    props.editor.chain().focus().unsetHighlight().run();
  } else {
    props.editor.chain().focus().toggleHighlight({ color }).run();
    addRecentColor(props.type, color);
  }
  isOpen.value = false;
  customColor.value = "";
}

function handleSwatchClick(color: string) {
  if (color === "inherit" || color === "transparent") {
    applyColor(color);
  } else {
    customColor.value = color;
    applyColor(color);
  }
}

function handleCustomColorSubmit() {
  const normalized = normalizeHexColor(customColor.value);
  if (isValidHexColor(normalized)) {
    applyColor(normalized);
  }
}

const previewColor = computed(() => {
  if (isCustomColorValid.value) {
    return normalizeHexColor(customColor.value);
  }
  return undefined;
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    handleCustomColorSubmit();
  }
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
      <!-- Recent colors -->
      <div v-if="showRecentColors && recentColors.length > 0" class="vizel-color-picker-section">
        <div class="vizel-color-picker-label">Recent</div>
        <div class="vizel-color-picker-recent">
          <button
            v-for="color in recentColors"
            :key="color"
            type="button"
            :class="['vizel-color-picker-swatch', { 'is-active': currentColor === color }]"
            :title="color"
            :style="{ backgroundColor: color }"
            :data-color="color"
            @click="handleSwatchClick(color)"
          />
        </div>
      </div>

      <!-- Color palette -->
      <div class="vizel-color-picker-section">
        <div class="vizel-color-picker-grid">
          <button
            v-for="colorDef in colorPalette"
            :key="colorDef.color"
            type="button"
            :class="['vizel-color-picker-swatch', { 'is-active': currentColor === colorDef.color }]"
            :title="colorDef.name"
            :style="getSwatchStyle(colorDef.color)"
            :data-color="colorDef.color"
            @click="handleSwatchClick(colorDef.color)"
          >
            <span
              v-if="colorDef.color === 'inherit' || colorDef.color === 'transparent'"
              class="vizel-color-picker-none"
            >×</span>
          </button>
        </div>
      </div>

      <!-- HEX input with preview -->
      <div v-if="allowCustomColor" class="vizel-color-picker-input-row">
        <span
          class="vizel-color-picker-preview"
          :style="{ backgroundColor: previewColor || 'transparent' }"
        />
        <input
          type="text"
          class="vizel-color-picker-input"
          placeholder="#000000"
          :value="customColor"
          maxlength="7"
          @input="customColor = ($event.target as HTMLInputElement).value"
          @keydown="handleKeyDown"
        >
        <button
          type="button"
          class="vizel-color-picker-apply"
          :disabled="!isCustomColorValid"
          title="Apply"
          @click="handleCustomColorSubmit"
        >
          ✓
        </button>
      </div>
    </div>
  </div>
</template>
