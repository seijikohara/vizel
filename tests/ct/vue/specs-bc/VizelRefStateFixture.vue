<script setup lang="ts">
import { type Editor, getVizelEditorState, useVizelState, Vizel } from "@vizel/vue";
import { computed, shallowRef } from "vue";

interface Props {
  initialContent?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialContent: "Test content",
});

// Store editor in a shallowRef so Vue's reactivity tracks its identity. The
// `useVizelState` composable returns a ref that increments on every Tiptap
// transaction; referencing `updateCount.value` inside the computed creates the
// dependency that re-runs `getVizelEditorState` on each update.
const editor = shallowRef<Editor | null>(null);

const updateCount = useVizelState(() => editor.value);

const editorState = computed(() => {
  void updateCount.value;
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
