<script setup lang="ts">
import {
  isVizelValidHexColor,
  normalizeVizelHexColor,
  type VizelColorDefinition,
} from "@vizel/core";
import { createVizelKeyboardGridController } from "@vizel/headless";
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import VizelIcon from "./VizelIcon.vue";

export interface VizelColorPickerProps {
  /** Color palette to display */
  colors: readonly VizelColorDefinition[];
  /** Label for accessibility */
  label?: string;
  /** Custom class name */
  class?: string;
  /** Enable custom HEX input (default: true) */
  allowCustomColor?: boolean;
  /** Recent colors to display */
  recentColors?: string[];
  /** Show recent colors section (default: true) */
  showRecentColors?: boolean;
  /** "None" option color values (e.g., ["transparent", "inherit"]) */
  noneValues?: string[];
  /** Label for recent colors section */
  recentLabel?: string;
  /** Placeholder for hex input */
  hexPlaceholder?: string;
  /** Title for apply button */
  applyTitle?: string;
  /** Aria label for apply button */
  applyAriaLabel?: string;
}

const props = withDefaults(defineProps<VizelColorPickerProps>(), {
  label: "Color palette",
  allowCustomColor: true,
  recentColors: () => [],
  showRecentColors: true,
  noneValues: () => ["transparent", "inherit"],
  recentLabel: "Recent",
  hexPlaceholder: "#000000",
  applyTitle: "Apply",
  applyAriaLabel: "Apply custom color",
});

/**
 * Selected color, exposed as a two-way binding (`v-model:value`).
 * Selecting a swatch or applying a valid HEX value writes the new color
 * back to the parent through the model, replacing the v1 `change` emit.
 * The model accepts `undefined` so callers can bind a source that has no
 * color yet (e.g. an editor attribute that is unset).
 */
const value = defineModel<string | undefined>("value");

const currentValue = computed(() => value.value);

const GRID_COLUMNS = 4;

const inputValue = ref("");
const focusedIndex = ref(-1);
const swatchRefs = ref<(HTMLButtonElement | null)[]>([]);
const gridRef = useTemplateRef<HTMLElement>("gridRef");

// The grid keyboard navigation (arrows, Home, End) is owned by the shared
// @vizel/headless controller (ADR-0003, ADR-0007) so the three adapters no
// longer duplicate the resolver. The swatches own their own keydown
// listener, so this component forwards each event through `handleKey`
// instead of letting the controller attach its own listener.
const gridController = createVizelKeyboardGridController({
  getRoot: () => gridRef.value,
  columns: GRID_COLUMNS,
  itemSelector: "[role=option]",
  onChange: (index) => {
    focusedIndex.value = index;
    swatchRefs.value[index]?.focus();
  },
});

// Build flat list of all selectable colors for keyboard navigation
const allColors = computed(() => [
  ...(props.showRecentColors ? props.recentColors : []),
  ...props.colors.map((c) => c.color),
]);

// Trim refs array when colors count decreases to prevent stale references
watch(
  () => allColors.value.length,
  (newLength) => {
    if (swatchRefs.value.length > newLength) {
      swatchRefs.value.length = newLength;
    }
  }
);

// Calculate the offset for color palette indices (after recent colors)
const paletteOffset = computed(() => (props.showRecentColors ? props.recentColors.length : 0));

// Find color definition by color value
function findColorDef(color: string): VizelColorDefinition | undefined {
  return props.colors.find((c) => c.color === color);
}

// Get display name for a color
function getColorName(color: string): string {
  const def = findColorDef(color);
  return def?.name ?? color;
}

// Check if a color is a "none" value
function isNoneValue(color: string): boolean {
  return props.noneValues.includes(color);
}

// Handle swatch selection
function handleSelect(color: string) {
  value.value = color;
  inputValue.value = "";
}

// Handle custom color input submit
function handleInputSubmit() {
  const normalized = normalizeVizelHexColor(inputValue.value);
  if (isVizelValidHexColor(normalized)) {
    value.value = normalized;
    inputValue.value = "";
  }
}

// Handle input keydown
function handleInputKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    handleInputSubmit();
  }
}

// Keyboard navigation handler
function handleKeyDown(e: KeyboardEvent, currentIndex: number) {
  if (allColors.value.length === 0) return;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const selectedColor = allColors.value[currentIndex];
    if (selectedColor) {
      handleSelect(selectedColor);
    }
    return;
  }

  // Resolve the focused swatch as the controller's current cell, then let
  // the shared grid resolver compute the next index.
  gridController.setSelectedIndex(currentIndex);
  if (gridController.handleKey(e)) {
    e.preventDefault();
  }
}

// Update input value when value prop changes
watch(
  currentValue,
  (value) => {
    if (value && !isNoneValue(value)) {
      inputValue.value = value;
    } else {
      inputValue.value = "";
    }
  },
  { immediate: true }
);

// Focus first swatch or current value on mount
onMounted(() => {
  const currentIndex = currentValue.value ? allColors.value.indexOf(currentValue.value) : -1;
  if (currentIndex >= 0) {
    focusedIndex.value = currentIndex;
  } else if (allColors.value.length > 0) {
    focusedIndex.value = 0;
  }
});

const isInputValid = computed(() => isVizelValidHexColor(normalizeVizelHexColor(inputValue.value)));
const previewColor = computed(() =>
  isInputValid.value ? normalizeVizelHexColor(inputValue.value) : undefined
);
</script>

<template>
  <div
    ref="gridRef"
    :class="['vizel-color-picker-content', $props.class]"
    role="listbox"
    :aria-label="props.label"
  >
    <!-- Recent colors -->
    <div
      v-if="showRecentColors && props.recentColors && props.recentColors.length > 0"
      class="vizel-color-picker-section"
    >
      <div class="vizel-color-picker-label">{{ props.recentLabel }}</div>
      <div class="vizel-color-picker-recent">
        <button
          v-for="(color, idx) in recentColors"
          :key="color"
          :ref="(el) => { swatchRefs[idx] = el as HTMLButtonElement | null }"
          type="button"
          role="option"
          :aria-selected="currentValue === color"
          :aria-label="color"
          :tabindex="focusedIndex === idx ? 0 : -1"
          :class="['vizel-color-picker-swatch', { 'is-active': currentValue === color }]"
          :style="{ backgroundColor: isNoneValue(color) ? 'transparent' : color }"
          :data-color="color"
          @click="handleSelect(color)"
          @keydown="handleKeyDown($event, idx)"
        >
          <span v-if="isNoneValue(color)" class="vizel-color-picker-none"><VizelIcon name="x" /></span>
        </button>
      </div>
    </div>

    <!-- Color palette -->
    <div class="vizel-color-picker-section">
      <div class="vizel-color-picker-grid">
        <button
          v-for="(colorDef, i) in colors"
          :key="colorDef.color"
          :ref="(el) => { swatchRefs[paletteOffset + i] = el as HTMLButtonElement | null }"
          type="button"
          role="option"
          :aria-selected="currentValue === colorDef.color"
          :aria-label="colorDef.name"
          :tabindex="focusedIndex === paletteOffset + i ? 0 : -1"
          :class="['vizel-color-picker-swatch', { 'is-active': currentValue === colorDef.color }]"
          :style="{ backgroundColor: isNoneValue(colorDef.color) ? 'transparent' : colorDef.color }"
          :data-color="colorDef.color"
          @click="handleSelect(colorDef.color)"
          @keydown="handleKeyDown($event, paletteOffset + i)"
        >
          <span v-if="isNoneValue(colorDef.color)" class="vizel-color-picker-none"><VizelIcon name="x" /></span>
        </button>
      </div>
    </div>

    <!-- HEX input with preview -->
    <div v-if="allowCustomColor" class="vizel-color-picker-input-row">
      <span
        class="vizel-color-picker-preview"
        :style="{ backgroundColor: previewColor || 'transparent' }"
        aria-hidden="true"
      />
      <input
        type="text"
        class="vizel-color-picker-input"
        :placeholder="props.hexPlaceholder"
        :value="inputValue"
        maxlength="7"
        aria-label="Custom color hex value"
        @input="inputValue = ($event.target as HTMLInputElement).value"
        @keydown="handleInputKeyDown"
      >
      <button
        type="button"
        class="vizel-color-picker-apply"
        :disabled="!isInputValid"
        :title="props.applyTitle"
        :aria-label="props.applyAriaLabel"
        @click="handleInputSubmit"
      >
        <VizelIcon name="check" />
      </button>
    </div>
  </div>
</template>
