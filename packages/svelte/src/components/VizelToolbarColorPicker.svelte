<script lang="ts" module>
import type { Editor } from "@tiptap/core";
import type { VizelColorDefinition } from "@vizel/core";

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
</script>

<script lang="ts">
import {
  addVizelRecentColor,
  getVizelRecentColors,
  VIZEL_HIGHLIGHT_COLORS,
  VIZEL_TEXT_COLORS,
} from "@vizel/core";
import { onMount, onDestroy } from "svelte";
import VizelColorPicker from "./VizelColorPicker.svelte";
import VizelIcon from "./VizelIcon.svelte";

let {
  editor,
  type,
  colors,
  class: className,
  allowCustomColor = true,
  showRecentColors = true,
}: VizelToolbarColorPickerProps = $props();

let isOpen = $state(false);
let recentColors = $state<string[]>([]);
let containerRef: HTMLDivElement | null = $state(null);

const colorPalette = $derived(colors ?? (type === "textColor" ? VIZEL_TEXT_COLORS : VIZEL_HIGHLIGHT_COLORS));

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
    recentColors = getVizelRecentColors(type);
  }
});

function handleColorChange(color: string) {
  if (type === "textColor") {
    if (color === "inherit") {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
      addVizelRecentColor(type, color);
    }
  } else if (color === "transparent") {
    editor.chain().focus().unsetHighlight().run();
  } else {
    editor.chain().focus().toggleHighlight({ color }).run();
    addVizelRecentColor(type, color);
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
      <VizelIcon name="textColor" />
    {:else}
      <VizelIcon name="highlighter" />
    {/if}
  </button>

  {#if isOpen}
    <div class="vizel-color-picker-dropdown">
      <VizelColorPicker
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
