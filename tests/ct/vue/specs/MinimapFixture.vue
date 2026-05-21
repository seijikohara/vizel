<script setup lang="ts">
import { useVizelEditor, VizelEditor, VizelMinimap, VizelProvider } from "@vizel/vue";

const props = withDefaults(
  defineProps<{
    width?: number;
    height?: number;
  }>(),
  {
    width: 120,
    height: 200,
  }
);

const editor = useVizelEditor({
  immediatelyRender: false,
});
</script>

<template>
  <VizelProvider :editor="editor">
    <div style="display: flex">
      <div style="flex: 1">
        <VizelEditor />
      </div>
      <VizelMinimap :editor="editor" :width="props.width" :height="props.height" />
    </div>
  </VizelProvider>
</template>
