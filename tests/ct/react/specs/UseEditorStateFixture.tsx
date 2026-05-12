import { getVizelEditorState } from "@vizel/core";
import { useVizelEditor, useVizelState, VizelEditor, VizelProvider } from "@vizel/react";

interface UseEditorStateFixtureProps {
  nullEditor?: boolean;
}

export function UseEditorStateFixture({ nullEditor = false }: UseEditorStateFixtureProps) {
  const editor = useVizelEditor({
    immediatelyRender: false,
  });

  const actualEditor = nullEditor ? null : editor;
  const updateCount = useVizelState(actualEditor);

  const isBoldActive = actualEditor?.isActive("bold") ?? false;
  const isItalicActive = actualEditor?.isActive("italic") ?? false;

  // Use getVizelEditorState to get full state including character/word counts
  const editorState = getVizelEditorState(actualEditor);

  return (
    <VizelProvider editor={actualEditor}>
      <div data-testid="update-count">{updateCount}</div>
      <div data-testid="bold-active">{String(isBoldActive)}</div>
      <div data-testid="italic-active">{String(isItalicActive)}</div>
      <div data-testid="character-count">{editorState.characterCount}</div>
      <div data-testid="word-count">{editorState.wordCount}</div>
      <div data-testid="is-empty">{String(editorState.isEmpty)}</div>
      <div data-testid="is-focused">{String(editorState.isFocused)}</div>
      <VizelEditor />
    </VizelProvider>
  );
}
