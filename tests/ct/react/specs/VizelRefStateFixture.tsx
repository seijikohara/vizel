import type { Editor } from "@tiptap/core";
import { getVizelEditorState } from "@vizel/core";
import { useVizelState, Vizel } from "@vizel/react";
import { useState } from "react";

interface VizelRefStateFixtureProps {
  initialContent?: string;
}

/**
 * Fixture that tests the correct pattern for using Vizel with state tracking.
 *
 * This pattern uses useState to store the editor reference, which triggers
 * a re-render when the editor is created in the onCreate callback.
 *
 * This is the CORRECT pattern that should be used in demo apps.
 */
export function VizelRefStateFixture({
  initialContent = "Test content",
}: VizelRefStateFixtureProps) {
  // Store editor in state (triggers re-renders when editor is set)
  const [editor, setEditor] = useState<Editor | null>(null);

  // Track editor state for character/word count
  useVizelState(() => editor);
  const editorState = getVizelEditorState(editor);

  return (
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
        onCreate={({ editor: createdEditor }) => {
          setEditor(createdEditor);
        }}
        onDestroy={() => {
          setEditor(null);
        }}
      />
    </div>
  );
}
