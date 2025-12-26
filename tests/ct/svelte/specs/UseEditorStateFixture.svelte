<script lang="ts">
import {
  EditorContent,
  EditorRoot,
  getEditorState,
  useEditorState,
  useVizelEditor,
} from "@vizel/svelte";

interface Props {
  nullEditor?: boolean;
}

let { nullEditor = false }: Props = $props();

const editor = useVizelEditor({
  immediatelyRender: false,
});

const actualEditor = $derived(nullEditor ? null : editor.current);
const editorStateHook = useEditorState(() => actualEditor);

// Depend on editorStateHook.current to trigger re-evaluation when editor state changes
const isBoldActive = $derived.by(() => {
  void editorStateHook.current;
  return actualEditor?.isActive("bold") ?? false;
});
const isItalicActive = $derived.by(() => {
  void editorStateHook.current;
  return actualEditor?.isActive("italic") ?? false;
});

// Use getEditorState to get full state including character/word counts
const fullEditorState = $derived.by(() => {
  void editorStateHook.current;
  return getEditorState(actualEditor);
});
</script>

<EditorRoot editor={actualEditor}>
  <div data-testid="update-count">{editorStateHook.current}</div>
  <div data-testid="bold-active">{String(isBoldActive)}</div>
  <div data-testid="italic-active">{String(isItalicActive)}</div>
  <div data-testid="character-count">{fullEditorState.characterCount}</div>
  <div data-testid="word-count">{fullEditorState.wordCount}</div>
  <div data-testid="is-empty">{String(fullEditorState.isEmpty)}</div>
  <div data-testid="is-focused">{String(fullEditorState.isFocused)}</div>
  <EditorContent />
</EditorRoot>
