<script lang="ts" module>
import type { VizelColorDefinition } from "@vizel/core";

export interface VizelColorPickerProps {
  /** Color palette to display */
  colors: readonly VizelColorDefinition[];
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
  /** Label for recent colors section */
  recentLabel?: string;
  /** Placeholder for hex input */
  hexPlaceholder?: string;
  /** Title for apply button */
  applyTitle?: string;
  /** Aria label for apply button */
  applyAriaLabel?: string;
}
</script>

<script lang="ts">
import { isVizelValidHexColor, normalizeVizelHexColor } from "@vizel/core";
import { createVizelKeyboardGridController } from "@vizel/headless";
import { untrack } from "svelte";
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
  recentLabel = "Recent",
  hexPlaceholder = "#000000",
  applyTitle = "Apply",
  applyAriaLabel = "Apply custom color",
}: VizelColorPickerProps = $props();

let inputValue = $state("");
let focusedIndex = $state(-1);
let swatchRefs: (HTMLButtonElement | null)[] = $state([]);
let inputRef: HTMLInputElement | null = $state(null);
let gridRef: HTMLElement | null = $state(null);

// The grid keyboard navigation (arrows, Home, End) is owned by the shared
// @vizel/headless controller so the three adapters no
// longer duplicate the resolver. The swatches own their own keydown
// listener, so this component forwards each event through `handleKey`
// instead of letting the controller attach its own listener.
const gridController = createVizelKeyboardGridController({
  getRoot: () => gridRef,
  columns: GRID_COLUMNS,
  itemSelector: "[role=option]",
  onChange: (index) => {
    focusedIndex = index;
    swatchRefs[index]?.focus();
  },
});

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
  if (allColors.length === 0) return;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const selectedColor = allColors[currentIndex];
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
$effect(() => {
  if (value && !isNoneValue(value)) {
    inputValue = value;
  } else {
    inputValue = "";
  }
});

// Focus first swatch or current value on mount. Wrap the body in
// `untrack` so a later `value` / `allColors` change does not yank
// `focusedIndex` back to the selected swatch in the middle of keyboard
// navigation (the previous shape registered both reactive reads and
// re-ran on every prop tick).
$effect(() => {
  untrack(() => {
    const currentIndex = value ? allColors.indexOf(value) : -1;
    if (currentIndex >= 0) {
      focusedIndex = currentIndex;
    } else if (allColors.length > 0) {
      focusedIndex = 0;
    }
  });
});

const isInputValid = $derived(isVizelValidHexColor(normalizeVizelHexColor(inputValue)));
const previewColor = $derived(isInputValid ? normalizeVizelHexColor(inputValue) : undefined);
</script>

<div
  bind:this={gridRef}
  class="vizel-color-picker-content {className ?? ''}"
  role="listbox"
  aria-label={label}
>
  <!-- Recent colors -->
  {#if showRecentColors && recentColors.length > 0}
    <div class="vizel-color-picker-section">
      <div class="vizel-color-picker-label">{recentLabel}</div>
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
        placeholder={hexPlaceholder}
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
        title={applyTitle}
        aria-label={applyAriaLabel}
        onclick={handleInputSubmit}
      >
        <VizelIcon name="check" />
      </button>
    </div>
  {/if}
</div>
