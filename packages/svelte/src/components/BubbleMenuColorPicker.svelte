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
}
</script>

<script lang="ts">
import { HIGHLIGHT_COLORS, TEXT_COLORS } from "@vizel/core";
import { onMount, onDestroy } from "svelte";

let { editor, type, colors, class: className }: BubbleMenuColorPickerProps = $props();

let isOpen = $state(false);
let containerRef: HTMLDivElement | null = $state(null);

const colorPalette = $derived(colors ?? (type === "textColor" ? TEXT_COLORS : HIGHLIGHT_COLORS));

const currentColor = $derived.by(() => {
  if (type === "textColor") {
    return editor.getAttributes("textStyle").color;
  }
  return editor.getAttributes("highlight").color;
});

const isTextColor = $derived(type === "textColor");

function handleColorSelect(color: string) {
  if (type === "textColor") {
    if (color === "inherit") {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  } else if (color === "transparent") {
    editor.chain().focus().unsetHighlight().run();
  } else {
    editor.chain().focus().toggleHighlight({ color }).run();
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
      <div class="vizel-color-picker-grid">
        {#each colorPalette as colorDef}
          <button
            type="button"
            class="vizel-color-picker-swatch {currentColor === colorDef.color ? 'is-active' : ''}"
            title={colorDef.name}
            style={getSwatchStyle(colorDef.color)}
            data-color={colorDef.color}
            onclick={() => handleColorSelect(colorDef.color)}
          >
            {#if colorDef.color === "inherit" || colorDef.color === "transparent"}
              <span class="vizel-color-picker-none">×</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
