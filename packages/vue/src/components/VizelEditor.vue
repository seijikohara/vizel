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

export interface VizelEditorRef {
  /** The container DOM element */
  container: HTMLDivElement | null;
  /**
   * The Tiptap editor instance that this component is rendering.
   *
   * Mirrors whichever editor was resolved (explicit prop or context).
   * Lets callers skip the extra round-trip through `useVizelContext` or
   * lifting state when they only need imperative access to the editor.
   */
  editor: Editor | null;
}

const props = defineProps<VizelEditorProps>();

const containerRef = ref<HTMLDivElement | null>(null);
const contextEditor = useVizelContextSafe();
const resolvedEditor = computed(() => props.editor ?? contextEditor?.value ?? null);

// Expose container ref and resolved editor instance to parent components.
// Getters ensure consumers read the live values rather than the snapshots
// captured at setup time.
defineExpose<VizelEditorRef>({
  get container() {
    return containerRef.value;
  },
  get editor() {
    return resolvedEditor.value;
  },
});

const mountState: { dispose: (() => void) | null } = { dispose: null };

watch(
  () => [resolvedEditor.value, containerRef.value] as const,
  ([editorValue, container]) => {
    mountState.dispose?.();
    mountState.dispose = null;
    if (editorValue && container) {
      mountState.dispose = mountVizelEditorView(editorValue, container);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  mountState.dispose?.();
  mountState.dispose = null;
});
</script>

<template>
  <div v-if="resolvedEditor" ref="containerRef" :class="$props.class" data-vizel-content />
</template>
