import { Markdown } from "@vizel/core";
import { EditorContent, EditorRoot, useVizelEditor } from "@vizel/react";
import { useState } from "react";

export function MarkdownFixture() {
  const [markdownOutput, setMarkdownOutput] = useState("");

  const editor = useVizelEditor({
    extensions: [Markdown],
  });

  const handleExport = () => {
    if (editor) {
      const md = editor.getMarkdown();
      setMarkdownOutput(md);
    }
  };

  const handleImport = () => {
    if (editor) {
      editor.commands.setContent("Hello **bold** world", {
        contentType: "markdown",
      });
    }
  };

  const handleImportCode = () => {
    if (editor) {
      editor.commands.setContent("```js\nconst x = 1;\n```", {
        contentType: "markdown",
      });
    }
  };

  const handleImportLink = () => {
    if (editor) {
      editor.commands.setContent("[Example](https://example.com)", {
        contentType: "markdown",
      });
    }
  };

  const handleImportStrikethrough = () => {
    if (editor) {
      editor.commands.setContent("This is ~~deleted~~ text", {
        contentType: "markdown",
      });
    }
  };

  const handleImportInlineCode = () => {
    if (editor) {
      editor.commands.setContent("Use the `variable` here", {
        contentType: "markdown",
      });
    }
  };

  const handleImportImage = () => {
    if (editor) {
      editor.commands.setContent("![Example](https://example.com/image.png)", {
        contentType: "markdown",
      });
    }
  };

  const handleImportOrderedList = () => {
    if (editor) {
      editor.commands.setContent("1. First\n2. Second\n3. Third", {
        contentType: "markdown",
      });
    }
  };

  const handleImportBlockquote = () => {
    if (editor) {
      editor.commands.setContent("> This is a quote", {
        contentType: "markdown",
      });
    }
  };

  const handleImportHr = () => {
    if (editor) {
      editor.commands.setContent("Above\n\n---\n\nBelow", {
        contentType: "markdown",
      });
    }
  };

  const handleImportTable = () => {
    if (editor) {
      editor.commands.setContent("| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |", {
        contentType: "markdown",
      });
    }
  };

  return (
    <EditorRoot editor={editor}>
      <div className="toolbar">
        <button type="button" data-testid="export-button" onClick={handleExport}>
          Export
        </button>
        <button type="button" data-testid="import-button" onClick={handleImport}>
          Import
        </button>
        <button type="button" data-testid="import-code-button" onClick={handleImportCode}>
          Import Code
        </button>
        <button type="button" data-testid="import-link-button" onClick={handleImportLink}>
          Import Link
        </button>
        <button
          type="button"
          data-testid="import-strikethrough-button"
          onClick={handleImportStrikethrough}
        >
          Import Strikethrough
        </button>
        <button
          type="button"
          data-testid="import-inline-code-button"
          onClick={handleImportInlineCode}
        >
          Import Inline Code
        </button>
        <button type="button" data-testid="import-image-button" onClick={handleImportImage}>
          Import Image
        </button>
        <button
          type="button"
          data-testid="import-ordered-list-button"
          onClick={handleImportOrderedList}
        >
          Import Ordered List
        </button>
        <button
          type="button"
          data-testid="import-blockquote-button"
          onClick={handleImportBlockquote}
        >
          Import Blockquote
        </button>
        <button type="button" data-testid="import-hr-button" onClick={handleImportHr}>
          Import HR
        </button>
        <button type="button" data-testid="import-table-button" onClick={handleImportTable}>
          Import Table
        </button>
      </div>
      <EditorContent />
      <pre data-testid="markdown-output">{markdownOutput}</pre>
    </EditorRoot>
  );
}
