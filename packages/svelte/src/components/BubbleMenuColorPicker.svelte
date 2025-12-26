<script lang="ts" module>
import type { ColorDefinition, Editor } from "@vizel/core";

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
</script>

<script lang="ts">
import {
  addRecentColor,
  getRecentColors,
  HIGHLIGHT_COLORS,
  isValidHexColor,
  normalizeHexColor,
  TEXT_COLORS,
} from "@vizel/core";
import { onMount, onDestroy } from "svelte";

let {
  editor,
  type,
  colors,
  class: className,
  allowCustomColor = true,
  showRecentColors = true,
}: BubbleMenuColorPickerProps = $props();

let isOpen = $state(false);
let customColor = $state("");
let recentColors = $state<string[]>([]);
let containerRef: HTMLDivElement | null = $state(null);

const colorPalette = $derived(colors ?? (type === "textColor" ? TEXT_COLORS : HIGHLIGHT_COLORS));

const currentColor = $derived.by(() => {
  if (type === "textColor") {
    return editor.getAttributes("textStyle").color;
  }
  return editor.getAttributes("highlight").color;
});

const isTextColor = $derived(type === "textColor");

const isCustomColorValid = $derived(isValidHexColor(normalizeHexColor(customColor)));

// Load recent colors and set initial input value when dropdown opens
$effect(() => {
  if (isOpen && showRecentColors) {
    recentColors = getRecentColors(type);
  }
  if (isOpen) {
    const current = currentColor;
    if (current && current !== "inherit" && current !== "transparent") {
      customColor = current;
    } else {
      customColor = "";
    }
  }
});

function applyColor(color: string) {
  if (type === "textColor") {
    if (color === "inherit") {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
      addRecentColor(type, color);
    }
  } else if (color === "transparent") {
    editor.chain().focus().unsetHighlight().run();
  } else {
    editor.chain().focus().toggleHighlight({ color }).run();
    addRecentColor(type, color);
  }
  isOpen = false;
  customColor = "";
}

function handleSwatchClick(color: string) {
  if (color === "inherit" || color === "transparent") {
    applyColor(color);
  } else {
    customColor = color;
    applyColor(color);
  }
}

function handleCustomColorSubmit() {
  const normalized = normalizeHexColor(customColor);
  if (isValidHexColor(normalized)) {
    applyColor(normalized);
  }
}

const previewColor = $derived(isCustomColorValid ? normalizeHexColor(customColor) : undefined);

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    handleCustomColorSubmit();
  }
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef && !containerRef.contains(event.target as Node)) {
    isOpen = false;
  }
}

onMount(() => {
  document.addEventListener("mousedown", handleClickOutside);
});

onDestroy(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});

function getSwatchStyle(color: string): string {
  return `background-color: ${color === "inherit" ? "transparent" : color}`;
}

function getTriggerStyle(): string {
  if (isTextColor) {
    return `color: ${currentColor || "inherit"}`;
  }
  return `--highlight-color: ${currentColor || "transparent"}`;
}
</script>

<div
  bind:this={containerRef}
  class="vizel-color-picker {className ?? ''}"
  data-type={type}
>
  <button
    type="button"
    class="vizel-bubble-menu-button vizel-color-picker-trigger {currentColor ? 'has-color' : ''}"
    title={isTextColor ? "Text Color" : "Highlight"}
    data-action={type}
    style={getTriggerStyle()}
    onclick={() => (isOpen = !isOpen)}
  >
    {#if isTextColor}
      A
    {:else}
      <span class="vizel-color-picker-highlight-icon">
        <span class="vizel-color-picker-highlight-bar"></span>
      </span>
    {/if}
  </button>

  {#if isOpen}
    <div class="vizel-color-picker-dropdown">
      <!-- Recent colors -->
      {#if showRecentColors && recentColors.length > 0}
        <div class="vizel-color-picker-section">
          <div class="vizel-color-picker-label">Recent</div>
          <div class="vizel-color-picker-recent">
            {#each recentColors as color}
              <button
                type="button"
                class="vizel-color-picker-swatch {currentColor === color ? 'is-active' : ''}"
                title={color}
                style="background-color: {color}"
                data-color={color}
                onclick={() => handleSwatchClick(color)}
              ></button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Color palette -->
      <div class="vizel-color-picker-section">
        <div class="vizel-color-picker-grid">
          {#each colorPalette as colorDef}
            <button
              type="button"
              class="vizel-color-picker-swatch {currentColor === colorDef.color ? 'is-active' : ''}"
              title={colorDef.name}
              style={getSwatchStyle(colorDef.color)}
              data-color={colorDef.color}
              onclick={() => handleSwatchClick(colorDef.color)}
            >
              {#if colorDef.color === "inherit" || colorDef.color === "transparent"}
                <span class="vizel-color-picker-none">×</span>
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
          ></span>
          <input
            type="text"
            class="vizel-color-picker-input"
            placeholder="#000000"
            value={customColor}
            maxlength={7}
            oninput={(e) => (customColor = (e.target as HTMLInputElement).value)}
            onkeydown={handleKeyDown}
          />
          <button
            type="button"
            class="vizel-color-picker-apply"
            disabled={!isCustomColorValid}
            title="Apply"
            onclick={handleCustomColorSubmit}
          >
            ✓
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
