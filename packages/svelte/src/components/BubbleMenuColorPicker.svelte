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
  TEXT_COLORS,
} from "@vizel/core";
import { onMount, onDestroy } from "svelte";
import ColorPicker from "./ColorPicker.svelte";

let {
  editor,
  type,
  colors,
  class: className,
  allowCustomColor = true,
  showRecentColors = true,
}: BubbleMenuColorPickerProps = $props();

let isOpen = $state(false);
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

const noneValues = $derived(isTextColor ? ["inherit"] : ["transparent"]);

// Load recent colors when dropdown opens
$effect(() => {
  if (isOpen && showRecentColors) {
    recentColors = getRecentColors(type);
  }
});

function handleColorChange(color: string) {
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
      <ColorPicker
        colors={colorPalette}
        value={currentColor}
        label={isTextColor ? "Text color palette" : "Highlight color palette"}
        {allowCustomColor}
        {recentColors}
        {showRecentColors}
        {noneValues}
        onchange={handleColorChange}
      />
    </div>
  {/if}
</div>
