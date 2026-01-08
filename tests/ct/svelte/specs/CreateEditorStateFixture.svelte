<script lang="ts">
import { getVizelEditorState } from "@vizel/core";
import { createVizelEditor, createVizelState, VizelEditor, VizelProvider } from "@vizel/svelte";

interface Props {
  nullEditor?: boolean;
}

let { nullEditor = false }: Props = $props();

const editor = createVizelEditor({
  immediatelyRender: false,
});

const actualEditor = $derived(nullEditor ? null : editor.current);
const editorStateRune = createVizelState(() => actualEditor);

// Depend on editorStateRune.current to trigger re-evaluation when editor state changes
const isBoldActive = $derived.by(() => {
  void editorStateRune.current;
  return actualEditor?.isActive("bold") ?? false;
});
const isItalicActive = $derived.by(() => {
  void editorStateRune.current;
  return actualEditor?.isActive("italic") ?? false;
});

// Use getVizelEditorState to get full state including character/word counts
const fullEditorState = $derived.by(() => {
  void editorStateRune.current;
  return getVizelEditorState(actualEditor);
});
</script>

<VizelProvider editor={actualEditor}>
  <div data-testid="update-count">{editorStateRune.current}</div>
  <div data-testid="bold-active">{String(isBoldActive)}</div>
  <div data-testid="italic-active">{String(isItalicActive)}</div>
  <div data-testid="character-count">{fullEditorState.characterCount}</div>
  <div data-testid="word-count">{fullEditorState.wordCount}</div>
  <div data-testid="is-empty">{String(fullEditorState.isEmpty)}</div>
  <div data-testid="is-focused">{String(fullEditorState.isFocused)}</div>
  <VizelEditor />
</VizelProvider>
