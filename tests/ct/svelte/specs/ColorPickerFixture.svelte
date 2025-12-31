<script lang="ts">
import { type ColorDefinition, HIGHLIGHT_COLORS, TEXT_COLORS } from "@vizel/core";
import { ColorPicker } from "@vizel/svelte";

interface Props {
  colors?: ColorDefinition[];
  value?: string;
  label?: string;
  class?: string;
  allowCustomColor?: boolean;
  recentColors?: string[];
  showRecentColors?: boolean;
  noneValues?: string[];
  useHighlightColors?: boolean;
}

let {
  colors,
  value,
  label = "Color palette",
  class: className,
  allowCustomColor = true,
  recentColors,
  showRecentColors = true,
  noneValues,
  useHighlightColors = false,
}: Props = $props();

let selectedColor = $state(value ?? "");

const colorPalette = $derived(colors ?? (useHighlightColors ? HIGHLIGHT_COLORS : TEXT_COLORS));

function handleChange(color: string) {
  selectedColor = color;
}
</script>

<div>
  <ColorPicker
    colors={colorPalette}
    value={selectedColor}
    onchange={handleChange}
    {label}
    class={className}
    {allowCustomColor}
    {recentColors}
    {showRecentColors}
    {noneValues}
  />
  <div data-testid="selected-color">{selectedColor}</div>
</div>
