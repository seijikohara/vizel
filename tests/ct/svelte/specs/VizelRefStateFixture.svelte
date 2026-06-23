<script lang="ts">
import { createVizelState, type Editor, getVizelEditorState, Vizel } from "@vizel/svelte";

interface Props {
  initialContent?: string;
}

let { initialContent = "Test content" }: Props = $props();

// `$state` is the Svelte 5 reactive primitive. When `handleCreate` assigns the
// editor instance, Svelte triggers a re-render so the count elements reflect
// the live state rather than the null-editor defaults.
let editor = $state<Editor | null>(null);

// `createVizelState` returns a reactive object whose `.version` increments on
// every Tiptap transaction. Referencing `.version` inside `$derived.by` makes
// `editorState` recompute on each update.
const updateCount = createVizelState(() => editor);

const editorState = $derived.by(() => {
  void updateCount.version;
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
