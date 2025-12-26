import { EditorContent, EditorRoot, useEditorState, useVizelEditor } from "@vizel/react";

interface UseEditorStateFixtureProps {
  nullEditor?: boolean;
}

export function UseEditorStateFixture({ nullEditor = false }: UseEditorStateFixtureProps) {
  const editor = useVizelEditor({
    immediatelyRender: false,
  });

  const actualEditor = nullEditor ? null : editor;
  const updateCount = useEditorState(actualEditor);

  const isBoldActive = actualEditor?.isActive("bold") ?? false;
  const isItalicActive = actualEditor?.isActive("italic") ?? false;

  return (
    <EditorRoot editor={actualEditor}>
      <div data-testid="update-count">{updateCount}</div>
      <div data-testid="bold-active">{String(isBoldActive)}</div>
      <div data-testid="italic-active">{String(isItalicActive)}</div>
      <EditorContent />
    </EditorRoot>
  );
}
