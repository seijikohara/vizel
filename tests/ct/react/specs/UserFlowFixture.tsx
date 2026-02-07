import { VizelMarkdown } from "@vizel/core";
import {
  useVizelAutoSave,
  useVizelEditor,
  VizelBubbleMenu,
  VizelEditor,
  VizelProvider,
} from "@vizel/react";
import { useCallback, useRef, useState } from "react";

export interface UserFlowFixtureProps {
  mode?: "markdown" | "auto-save" | "default";
  storageKey?: string;
}

const AUTO_SAVE_STORAGE_KEY = "vizel-test-auto-save";

export function UserFlowFixture({
  mode = "default",
  storageKey = AUTO_SAVE_STORAGE_KEY,
}: UserFlowFixtureProps) {
  if (mode === "markdown") {
    return <MarkdownMode />;
  }
  if (mode === "auto-save") {
    return <AutoSaveMode storageKey={storageKey} />;
  }
  return <DefaultMode />;
}

function DefaultMode() {
  const editor = useVizelEditor({});

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <VizelBubbleMenu />
    </VizelProvider>
  );
}

function MarkdownMode() {
  const [markdownOutput, setMarkdownOutput] = useState("");

  const editor = useVizelEditor({
    extensions: [VizelMarkdown],
  });

  const handleExport = () => {
    if (editor) {
      setMarkdownOutput(editor.getMarkdown());
    }
  };

  const handleClear = () => {
    if (editor) {
      editor.commands.clearContent();
    }
  };

  const handleImportFromOutput = () => {
    if (editor && markdownOutput) {
      editor.commands.setContent(markdownOutput, {
        contentType: "markdown",
      });
    }
  };

  return (
    <VizelProvider editor={editor}>
      <div>
        <button type="button" data-testid="export-button" onClick={handleExport}>
          Export
        </button>
        <button type="button" data-testid="clear-button" onClick={handleClear}>
          Clear
        </button>
        <button
          type="button"
          data-testid="import-from-output-button"
          onClick={handleImportFromOutput}
        >
          Import From Output
        </button>
      </div>
      <VizelEditor />
      <pre data-testid="markdown-output">{markdownOutput}</pre>
    </VizelProvider>
  );
}

function AutoSaveMode({ storageKey }: { storageKey: string }) {
  const editor = useVizelEditor({});

  // Use a ref + useCallback to keep the getter stable across re-renders,
  // preventing useEffect cleanup from cancelling the debounced save.
  // Depend on `editor` so the hook re-subscribes when editor initializes.
  const editorRef = useRef(editor);
  editorRef.current = editor;
  // biome-ignore lint/correctness/useExhaustiveDependencies: editor triggers re-subscription in auto-save hook
  const getEditor = useCallback(() => editorRef.current, [editor]);

  const { status } = useVizelAutoSave(getEditor, {
    debounceMs: 50,
    storage: "localStorage",
    key: storageKey,
  });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <span data-testid="save-status">{status}</span>
    </VizelProvider>
  );
}
