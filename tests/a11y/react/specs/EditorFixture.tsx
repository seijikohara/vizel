import { useVizelEditor, VizelEditor, VizelProvider } from "@vizel/react";

/**
 * Minimal editor fixture for the a11y suite. Boots the editor with a
 * non-empty initial document so axe-core sees the rendered ProseMirror
 * tree rather than the placeholder-only state.
 */
export function EditorFixture() {
  const editor = useVizelEditor({
    placeholder: "Type something...",
    initialContent: "<h1>Heading</h1><p>Body text.</p>",
  });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
    </VizelProvider>
  );
}
