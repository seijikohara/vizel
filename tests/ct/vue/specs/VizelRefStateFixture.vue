<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import { getVizelEditorState } from "@vizel/core";
import { useVizelState, Vizel } from "@vizel/vue";
import { computed, shallowRef } from "vue";

interface Props {
  initialContent?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialContent: "Test content",
});

// Store editor in state (triggers re-renders when editor is set)
const editor = shallowRef<Editor | null>(null);

// Track editor state for character/word count
// The updateCount ref changes on every editor transaction
const updateCount = useVizelState(() => editor.value);

// Use updateCount in computed to create dependency
const editorState = computed(() => {
  void updateCount.value; // Create dependency on updateCount
  return getVizelEditorState(editor.value);
});

function handleCreate({ editor: createdEditor }: { editor: Editor }) {
  editor.value = createdEditor;
}

function handleDestroy() {
  editor.value = null;
}
</script>

<template>
  <div>
    <div data-testid="character-count">{{ editorState.characterCount }}</div>
    <div data-testid="word-count">{{ editorState.wordCount }}</div>
    <div data-testid="is-empty">{{ String(editorState.isEmpty) }}</div>
    <Vizel
      :initial-content="{
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: props.initialContent }],
          },
        ],
      }"
      @create="handleCreate"
      @destroy="handleDestroy"
    />
  </div>
</template>
