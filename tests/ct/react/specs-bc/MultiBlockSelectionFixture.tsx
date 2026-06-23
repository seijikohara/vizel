import { getVizelMultiBlockSelectionState } from "@vizel/core";
import { useVizelEditor, useVizelState, VizelEditor, VizelProvider } from "@vizel/react";
import { useEffect } from "react";

export function MultiBlockSelectionFixture() {
  const editor = useVizelEditor({
    immediatelyRender: false,
  });
  useVizelState(editor);

  // Expose the editor on `window` for Playwright-driven selection
  // setup. The scenarios drive selection through Tiptap's command bus
  // because synthetic keystrokes for chord combinations
  // (`ControlOrMeta+Home`, etc.) behave differently across browsers.
  useEffect(() => {
    if (!editor) return;
    (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor = editor;
    return () => {
      delete (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor;
    };
  }, [editor]);

  const rangeState = editor ? getVizelMultiBlockSelectionState(editor.state) : null;
  const summary = rangeState
    ? `blocks=${rangeState.blockPositions.length} from=${rangeState.from} to=${rangeState.to}`
    : "blocks=0";

  return (
    <VizelProvider editor={editor}>
      <div data-testid="multi-block-state">{summary}</div>
      <VizelEditor />
    </VizelProvider>
  );
}
