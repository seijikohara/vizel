<script setup lang="ts">
import type { Editor } from "@vizel/core";
import { computed, ref, watch } from "vue";
import { useEditorContextSafe } from "./EditorContext.ts";

export interface EditorContentProps {
  /** Override the editor from context */
  editor?: Editor;
  /** Custom class name */
  class?: string;
}

const props = defineProps<EditorContentProps>();

const containerRef = ref<HTMLDivElement | null>(null);
const getContextEditor = useEditorContextSafe();
const editor = computed(() => props.editor ?? getContextEditor?.());

watch(
  () => [editor.value, containerRef.value] as const,
  (
    [editorValue, container],
    oldValue?: readonly [Editor | null | undefined, HTMLDivElement | null]
  ) => {
    // Cleanup: remove DOM from previous container if editor or container changed
    const prevEditor = oldValue?.[0];
    const prevContainer = oldValue?.[1];
    if (prevEditor && prevContainer && prevEditor.view.dom.parentNode === prevContainer) {
      prevContainer.removeChild(prevEditor.view.dom);
    }

    if (editorValue && container) {
      // Mount the editor's DOM view to the container element
      container.appendChild(editorValue.view.dom);

      // Update editable state
      editorValue.view.setProps({
        editable: () => editorValue?.isEditable ?? false,
      });
    }
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="editor" ref="containerRef" :class="$props.class" data-vizel-content />
</template>
