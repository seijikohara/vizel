<script lang="ts">
import type { Editor } from "@tiptap/core";
import { getVizelEditorState } from "@vizel/core";
import { createVizelState, Vizel } from "@vizel/svelte";

interface Props {
  initialContent?: string;
}

let { initialContent = "Test content" }: Props = $props();

// Store editor in state (triggers re-renders when editor is set)
let editor = $state<Editor | null>(null);

// Track editor state for character/word count
// The updateCount changes on every editor transaction
const updateCount = createVizelState(() => editor);

// Use $derived.by to access updateCount.current and create dependency
const editorState = $derived.by(() => {
  void updateCount.current; // Create dependency on updateCount
  return getVizelEditorState(editor);
});

function handleCreate({ editor: createdEditor }: { editor: Editor }) {
  editor = createdEditor;
}

function handleDestroy() {
  editor = null;
}
</script>

<div>
  <div data-testid="character-count">{editorState.characterCount}</div>
  <div data-testid="word-count">{editorState.wordCount}</div>
  <div data-testid="is-empty">{String(editorState.isEmpty)}</div>
  <Vizel
    initialContent={{
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: initialContent }],
        },
      ],
    }}
    onCreate={handleCreate}
    onDestroy={handleDestroy}
  />
</div>
