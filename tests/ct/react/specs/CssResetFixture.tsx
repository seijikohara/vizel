import {
  useVizelEditor,
  useVizelState,
  VizelBubbleMenu,
  VizelEditor,
  VizelProvider,
  vizelDefaultFeatures,
} from "@vizel/react";
import { useEffect } from "react";

/**
 * Fixture for host-CSS-reset scenarios. Enables the curated feature set so a
 * seeded document can contain callouts, details, tables, and task lists, and
 * exposes the editor on `window.vizelTestEditor` so a scenario can set rich
 * ProseMirror JSON content. The bubble menu is rendered so the link editor is
 * reachable.
 */
export function CssResetFixture() {
  const editor = useVizelEditor({
    immediatelyRender: false,
    features: vizelDefaultFeatures(),
  });
  useVizelState(editor);

  useEffect(() => {
    if (!editor) return;
    const win = window as unknown as { vizelTestEditor?: unknown };
    win.vizelTestEditor = editor;
    return () => {
      delete win.vizelTestEditor;
    };
  }, [editor]);

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <VizelBubbleMenu />
    </VizelProvider>
  );
}
