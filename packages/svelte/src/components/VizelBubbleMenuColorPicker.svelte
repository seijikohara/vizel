<script lang="ts" module>
import type { Editor, VizelColorDefinition, VizelLocale } from "@vizel/core";

export interface VizelBubbleMenuColorPickerProps {
  /** The editor instance */
  editor: Editor;
  /** Color picker type */
  type: "textColor" | "highlight";
  /** Custom color palette */
  colors?: readonly VizelColorDefinition[];
  /** Custom class name */
  class?: string;
  /** Enable custom color input (default: true) */
  allowCustomColor?: boolean;
  /** Enable recent colors (default: true) */
  showRecentColors?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import {
  applyVizelColorToEditor,
  getVizelRecentColors,
  VIZEL_HIGHLIGHT_COLORS,
  VIZEL_TEXT_COLORS,
} from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";

import VizelColorPicker from "./VizelColorPicker.svelte";
import VizelIcon from "./VizelIcon.svelte";

let {
  editor,
  type,
  colors,
  class: className,
  allowCustomColor = true,
  showRecentColors = true,
  locale,
}: VizelBubbleMenuColorPickerProps = $props();

let isOpen = $state(false);
let recentColors = $state<string[]>([]);
let containerRef: HTMLDivElement | null = $state(null);

const colorPalette = $derived(
  colors ?? (type === "textColor" ? VIZEL_TEXT_COLORS : VIZEL_HIGHLIGHT_COLORS)
);

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
  applyVizelColorToEditor(editor, type, color);
  isOpen = false;
}

// Pointer-outside dismissal routes through `createVizelDismissable` from
// `@vizel/headless` so this component never attaches document listeners
// directly.
$effect(() => {
  if (!isOpen || !containerRef) return;
  const controller = createVizelDismissable({
    onPointerOutside: () => {
      isOpen = false;
    },
  });
  controller.mount(containerRef);
  return () => controller.unmount();
});

function getTriggerStyle(): string {
  if (isTextColor) {
    return `color: ${currentColor || "inherit"}`;
  }
  return `--highlight-color: ${currentColor || "transparent"}`;
}
</script>

<div bind:this={containerRef} class="vizel-color-picker {className ?? ''}" data-type={type}>
  <button
    type="button"
    class="vizel-bubble-menu-button vizel-color-picker-trigger {currentColor ? 'has-color' : ''}"
    title={isTextColor
      ? (locale?.colorPicker?.textColor ?? "Text Color")
      : (locale?.colorPicker?.highlight ?? "Highlight")}
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
        label={isTextColor
          ? (locale?.colorPicker?.textColorPalette ?? "Text color palette")
          : (locale?.colorPicker?.highlightPalette ?? "Highlight color palette")}
        {allowCustomColor}
        {recentColors}
        {showRecentColors}
        {noneValues}
        recentLabel={locale?.colorPicker?.recent ?? "Recent"}
        hexPlaceholder={locale?.colorPicker?.hexPlaceholder ?? "#000000"}
        applyTitle={locale?.colorPicker?.apply ?? "Apply"}
        applyAriaLabel={locale?.colorPicker?.applyAriaLabel ?? "Apply custom color"}
        onchange={handleColorChange}
      />
    </div>
  {/if}
</div>
