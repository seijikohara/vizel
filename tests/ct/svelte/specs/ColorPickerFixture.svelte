<script lang="ts">
import { VIZEL_HIGHLIGHT_COLORS, VIZEL_TEXT_COLORS, type VizelColorDefinition } from "@vizel/core";
import { VizelColorPicker } from "@vizel/svelte";

interface Props {
  colors?: VizelColorDefinition[];
  value?: string;
  label?: string;
  class?: string;
  allowCustomColor?: boolean;
  recentColors?: string[];
  showRecentColors?: boolean;
  noneValues?: string[];
  useHighlightColors?: boolean;
}

const props = $props<Props>();

let selectedColor = $state(props.value ?? "");

const colorPalette = $derived(
  props.colors ?? (props.useHighlightColors ? VIZEL_HIGHLIGHT_COLORS : VIZEL_TEXT_COLORS)
);

function handleChange(color: string) {
  selectedColor = color;
}
</script>

<div>
  <VizelColorPicker
    colors={colorPalette}
    value={selectedColor}
    onchange={handleChange}
    label={props.label ?? "Color palette"}
    class={props.class}
    allowCustomColor={props.allowCustomColor ?? true}
    recentColors={props.recentColors}
    showRecentColors={props.showRecentColors ?? true}
    noneValues={props.noneValues}
  />
  <div data-testid="selected-color">{selectedColor}</div>
</div>
