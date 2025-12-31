<script setup lang="ts">
import { type ColorDefinition, HIGHLIGHT_COLORS, TEXT_COLORS } from "@vizel/core";
import { ColorPicker } from "@vizel/vue";
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    colors?: ColorDefinition[];
    value?: string;
    label?: string;
    class?: string;
    allowCustomColor?: boolean;
    recentColors?: string[];
    showRecentColors?: boolean;
    noneValues?: string[];
    useHighlightColors?: boolean;
  }>(),
  {
    label: "Color palette",
    allowCustomColor: true,
    showRecentColors: true,
    useHighlightColors: false,
  }
);

const selectedColor = ref(props.value ?? "");

const colorPalette = computed(() => {
  return props.colors ?? (props.useHighlightColors ? HIGHLIGHT_COLORS : TEXT_COLORS);
});

function handleChange(color: string) {
  selectedColor.value = color;
}
</script>

<template>
  <div>
    <ColorPicker
      :colors="colorPalette"
      :value="selectedColor"
      :label="props.label"
      :class="props.class"
      :allow-custom-color="props.allowCustomColor ?? true"
      :recent-colors="props.recentColors"
      :show-recent-colors="props.showRecentColors ?? true"
      :none-values="props.noneValues"
      @change="handleChange"
    />
    <div data-testid="selected-color">{{ selectedColor }}</div>
  </div>
</template>
