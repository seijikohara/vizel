<script setup lang="ts">
import { type Editor, mountVizelEditorView } from "@vizel/core";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useVizelContextSafe } from "./VizelContext.ts";

export interface VizelEditorProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
}

export interface VizelExposed {
  /** The container DOM element */
  container: HTMLDivElement | null;
}

const props = defineProps<VizelEditorProps>();

const containerRef = ref<HTMLDivElement | null>(null);
const contextEditor = useVizelContextSafe();
const resolvedEditor = computed(() => props.editor ?? contextEditor?.value ?? null);

// Expose container ref to parent component
defineExpose<VizelExposed>({
  get container() {
    return containerRef.value;
  },
});

let dispose: (() => void) | null = null;

watch(
  () => [resolvedEditor.value, containerRef.value] as const,
  ([editorValue, container]) => {
    dispose?.();
    dispose = null;
    if (editorValue && container) {
      dispose = mountVizelEditorView(editorValue, container);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  dispose?.();
  dispose = null;
});
</script>

<template>
  <div v-if="resolvedEditor" ref="containerRef" :class="$props.class" data-vizel-content />
</template>
