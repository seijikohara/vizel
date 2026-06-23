import { type Editor, getVizelEditorState, useVizelState, Vizel } from "@vizel/react";
import { useState } from "react";

interface VizelRefStateFixtureProps {
  initialContent?: string;
}

/**
 * Fixture for the vizel-ref-state scenario.
 *
 * Stores the editor in React state rather than a ref so the `onCreate`
 * callback triggers a re-render. `useVizelState` then tracks transactions
 * so `getVizelEditorState` returns live character and word counts.
 */
export function VizelRefStateFixture({
  initialContent = "Test content",
}: VizelRefStateFixtureProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  useVizelState(editor);
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
