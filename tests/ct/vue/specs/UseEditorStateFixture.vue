<script setup lang="ts">
import { EditorContent, EditorRoot, useEditorState, useVizelEditor } from "@vizel/vue";
import { computed } from "vue";

const props = defineProps<{
  nullEditor?: boolean;
}>();

const editor = useVizelEditor({
  immediatelyRender: false,
});

const actualEditor = computed(() => (props.nullEditor ? null : editor.value));
const updateCount = useEditorState(() => actualEditor.value);

// Depend on updateCount to trigger re-evaluation when editor state changes
const isBoldActive = computed(() => {
  void updateCount.value;
  return actualEditor.value?.isActive("bold") ?? false;
});
const isItalicActive = computed(() => {
  void updateCount.value;
  return actualEditor.value?.isActive("italic") ?? false;
});
</script>

<template>
  <EditorRoot :editor="actualEditor">
    <div data-testid="update-count">{{ updateCount }}</div>
    <div data-testid="bold-active">{{ String(isBoldActive) }}</div>
    <div data-testid="italic-active">{{ String(isItalicActive) }}</div>
    <EditorContent />
  </EditorRoot>
</template>
