<script lang="ts" module>
import type { VizelColorDefinition } from "@vizel/core";

export interface VizelColorPickerProps {
  /** Color palette to display */
  colors: VizelColorDefinition[];
  /** Currently selected color */
  value?: string;
  /** Callback when color is selected */
  onchange: (color: string) => void;
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
</script>

<script lang="ts">
import { isVizelValidHexColor, normalizeVizelHexColor } from "@vizel/core";
import VizelIcon from "./VizelIcon.svelte";

const GRID_COLUMNS = 4;

let {
  colors,
  value,
  onchange,
  label = "Color palette",
  class: className,
  allowCustomColor = true,
  recentColors = [],
  showRecentColors = true,
  noneValues = ["transparent", "inherit"],
}: VizelColorPickerProps = $props();

let inputValue = $state("");
let focusedIndex = $state(-1);
let swatchRefs: (HTMLButtonElement | null)[] = $state([]);
let inputRef: HTMLInputElement | null = $state(null);

// Clean up swatchRefs when colors decrease
$effect(() => {
  const length = allColors.length;
  if (swatchRefs.length > length) {
    swatchRefs.length = length;
  }
});

// Build flat list of all selectable colors for keyboard navigation
const allColors = $derived([
  ...(showRecentColors ? recentColors : []),
  ...colors.map((c) => c.color),
]);

// Calculate the offset for color palette indices (after recent colors)
const paletteOffset = $derived(showRecentColors ? recentColors.length : 0);

// Find color definition by color value
function findColorDef(color: string): VizelColorDefinition | undefined {
  return colors.find((c) => c.color === color);
}

// Get display name for a color
function getColorName(color: string): string {
  const def = findColorDef(color);
  return def?.name ?? color;
}

// Check if a color is a "none" value
function isNoneValue(color: string): boolean {
  return noneValues.includes(color);
}

// Handle swatch selection
function handleSelect(color: string) {
  onchange(color);
  inputValue = "";
}

// Handle custom color input submit
function handleInputSubmit() {
  const normalized = normalizeVizelHexColor(inputValue);
  if (isVizelValidHexColor(normalized)) {
    onchange(normalized);
    inputValue = "";
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
  const totalColors = allColors.length;
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
      const selectedColor = allColors[currentIndex];
      if (selectedColor) {
        handleSelect(selectedColor);
      }
      return;
    }
  }

  if (handled) {
    e.preventDefault();
    focusedIndex = newIndex;
    swatchRefs[newIndex]?.focus();
  }
}

// Update input value when value prop changes
$effect(() => {
  if (value && !isNoneValue(value)) {
    inputValue = value;
  } else {
    inputValue = "";
  }
});

// Focus first swatch or current value on mount (run only once)
$effect(() => {
  const currentIndex = value ? allColors.indexOf(value) : -1;
  if (currentIndex >= 0) {
    focusedIndex = currentIndex;
  } else if (allColors.length > 0) {
    focusedIndex = 0;
  }
});

const isInputValid = $derived(isVizelValidHexColor(normalizeVizelHexColor(inputValue)));
const previewColor = $derived(isInputValid ? normalizeVizelHexColor(inputValue) : undefined);
</script>

<div
  class="vizel-color-picker-content {className ?? ''}"
  role="listbox"
  aria-label={label}
>
  <!-- Recent colors -->
  {#if showRecentColors && recentColors.length > 0}
    <div class="vizel-color-picker-section">
      <div class="vizel-color-picker-label">Recent</div>
      <div class="vizel-color-picker-recent">
        {#each recentColors as color, idx}
          <button
            bind:this={swatchRefs[idx]}
            type="button"
            role="option"
            aria-selected={value === color}
            aria-label={color}
            tabindex={focusedIndex === idx ? 0 : -1}
            class="vizel-color-picker-swatch {value === color ? 'is-active' : ''}"
            style="background-color: {isNoneValue(color) ? 'transparent' : color}"
            data-color={color}
            onclick={() => handleSelect(color)}
            onkeydown={(e) => handleKeyDown(e, idx)}
          >
            {#if isNoneValue(color)}
              <span class="vizel-color-picker-none"><VizelIcon name="x" /></span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Color palette -->
  <div class="vizel-color-picker-section">
    <div class="vizel-color-picker-grid">
      {#each colors as colorDef, i}
        {@const idx = paletteOffset + i}
        <button
          bind:this={swatchRefs[idx]}
          type="button"
          role="option"
          aria-selected={value === colorDef.color}
          aria-label={colorDef.name}
          tabindex={focusedIndex === idx ? 0 : -1}
          class="vizel-color-picker-swatch {value === colorDef.color ? 'is-active' : ''}"
          style="background-color: {isNoneValue(colorDef.color) ? 'transparent' : colorDef.color}"
          data-color={colorDef.color}
          onclick={() => handleSelect(colorDef.color)}
          onkeydown={(e) => handleKeyDown(e, idx)}
        >
          {#if isNoneValue(colorDef.color)}
            <span class="vizel-color-picker-none"><VizelIcon name="x" /></span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- HEX input with preview -->
  {#if allowCustomColor}
    <div class="vizel-color-picker-input-row">
      <span
        class="vizel-color-picker-preview"
        style="background-color: {previewColor || 'transparent'}"
        aria-hidden="true"
      ></span>
      <input
        bind:this={inputRef}
        type="text"
        class="vizel-color-picker-input"
        placeholder="#000000"
        value={inputValue}
        maxlength={7}
        aria-label="Custom color hex value"
        oninput={(e) => (inputValue = (e.target as HTMLInputElement).value)}
        onkeydown={handleInputKeyDown}
      />
      <button
        type="button"
        class="vizel-color-picker-apply"
        disabled={!isInputValid}
        title="Apply"
        aria-label="Apply custom color"
        onclick={handleInputSubmit}
      >
        <VizelIcon name="check" />
      </button>
    </div>
  {/if}
</div>
