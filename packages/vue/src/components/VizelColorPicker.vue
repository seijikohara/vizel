<script setup lang="ts">
import type { VizelColorDefinition } from "@vizel/core";
import { computed, onMounted, ref, watch } from "vue";
import VizelIcon from "./VizelIcon.vue";

/**
 * Validates a hex color string
 */
function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Normalizes a hex color string (adds # prefix if missing)
 */
function normalizeHexColor(color: string): string {
  const trimmed = color.trim();
  if (trimmed.startsWith("#")) {
    return trimmed;
  }
  return `#${trimmed}`;
}

export interface VizelColorPickerProps {
  /** Color palette to display */
  colors: VizelColorDefinition[];
  /**
   * Currently selected color (v-model supported)
   * @deprecated Use modelValue instead for v-model binding
   */
  value?: string;
  /** Currently selected color for v-model binding */
  modelValue?: string;
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
}

const props = withDefaults(defineProps<VizelColorPickerProps>(), {
  label: "Color palette",
  allowCustomColor: true,
  recentColors: () => [],
  showRecentColors: true,
  noneValues: () => ["transparent", "inherit"],
});

const emit = defineEmits<{
  /** @deprecated Use update:modelValue for v-model binding */
  change: [color: string];
  /** Emitted when the selected color changes (v-model) */
  "update:modelValue": [color: string];
}>();

// Support both value and modelValue for backwards compatibility
const currentValue = computed(() => props.modelValue ?? props.value);

const GRID_COLUMNS = 4;

const inputValue = ref("");
const focusedIndex = ref(-1);
const swatchRefs = ref<(HTMLButtonElement | null)[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);

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
  emit("change", color);
  emit("update:modelValue", color);
  inputValue.value = "";
}

// Handle custom color input submit
function handleInputSubmit() {
  const normalized = normalizeHexColor(inputValue.value);
  if (isValidHexColor(normalized)) {
    emit("change", normalized);
    emit("update:modelValue", normalized);
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
  const totalColors = allColors.value.length;
  if (totalColors === 0) return;

  let newIndex = currentIndex;
  let handled = false;

  switch (e.key) {
    case "ArrowRight":
      newIndex = (currentIndex + 1) % totalColors;
      handled = true;
      break;
    case "ArrowLeft":
      newIndex = (currentIndex - 1 + totalColors) % totalColors;
      handled = true;
      break;
    case "ArrowDown":
      newIndex = Math.min(currentIndex + GRID_COLUMNS, totalColors - 1);
      handled = true;
      break;
    case "ArrowUp":
      newIndex = Math.max(currentIndex - GRID_COLUMNS, 0);
      handled = true;
      break;
    case "Home":
      newIndex = 0;
      handled = true;
      break;
    case "End":
      newIndex = totalColors - 1;
      handled = true;
      break;
    case "Enter":
    case " ": {
      e.preventDefault();
      const selectedColor = allColors.value[currentIndex];
      if (selectedColor) {
        handleSelect(selectedColor);
      }
      return;
    }
    default:
      break;
  }

  if (handled) {
    e.preventDefault();
    focusedIndex.value = newIndex;
    swatchRefs.value[newIndex]?.focus();
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

const isInputValid = computed(() => isValidHexColor(normalizeHexColor(inputValue.value)));
const previewColor = computed(() =>
  isInputValid.value ? normalizeHexColor(inputValue.value) : undefined
);
</script>

<template>
  <div
    :class="['vizel-color-picker-content', $props.class]"
    role="listbox"
    :aria-label="props.label"
  >
    <!-- Recent colors -->
    <div
      v-if="showRecentColors && props.recentColors && props.recentColors.length > 0"
      class="vizel-color-picker-section"
    >
      <div class="vizel-color-picker-label">Recent</div>
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
        ref="inputRef"
        type="text"
        class="vizel-color-picker-input"
        placeholder="#000000"
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
        title="Apply"
        aria-label="Apply custom color"
        @click="handleInputSubmit"
      >
        <VizelIcon name="check" />
      </button>
    </div>
  </div>
</template>
