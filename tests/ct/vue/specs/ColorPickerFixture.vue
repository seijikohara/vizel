<script setup lang="ts">
import {
  VIZEL_HIGHLIGHT_COLORS,
  VIZEL_TEXT_COLORS,
  type VizelColorDefinition,
  VizelColorPicker,
} from "@vizel/vue";
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    colors?: VizelColorDefinition[];
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
  return props.colors ?? (props.useHighlightColors ? VIZEL_HIGHLIGHT_COLORS : VIZEL_TEXT_COLORS);
});
</script>

<template>
  <div>
    <VizelColorPicker
      v-model:value="selectedColor"
      :colors="colorPalette"
      :label="props.label"
      :class="props.class"
      :allow-custom-color="props.allowCustomColor ?? true"
      :recent-colors="props.recentColors"
      :show-recent-colors="props.showRecentColors ?? true"
      :none-values="props.noneValues"
    />
    <div data-testid="selected-color">{{ selectedColor }}</div>
  </div>
</template>
