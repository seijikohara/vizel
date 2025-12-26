<script lang="ts">
import { EditorContent, EditorRoot, useEditorState, useVizelEditor } from "@vizel/svelte";

interface Props {
  nullEditor?: boolean;
}

let { nullEditor = false }: Props = $props();

const editor = useVizelEditor({
  immediatelyRender: false,
});

const actualEditor = $derived(nullEditor ? null : editor.current);
const editorState = useEditorState(() => actualEditor);

// Depend on editorState.current to trigger re-evaluation when editor state changes
const isBoldActive = $derived.by(() => {
  void editorState.current;
  return actualEditor?.isActive("bold") ?? false;
});
const isItalicActive = $derived.by(() => {
  void editorState.current;
  return actualEditor?.isActive("italic") ?? false;
});
</script>

<EditorRoot editor={actualEditor}>
  <div data-testid="update-count">{editorState.current}</div>
  <div data-testid="bold-active">{String(isBoldActive)}</div>
  <div data-testid="italic-active">{String(isItalicActive)}</div>
  <EditorContent />
</EditorRoot>
