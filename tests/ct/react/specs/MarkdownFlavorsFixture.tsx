import type { VizelMarkdownFlavor } from "@vizel/core";
import { useVizelEditor, VizelEditor, VizelProvider } from "@vizel/react";
import { useState } from "react";

export interface MarkdownFlavorsFixtureProps {
  flavor?: VizelMarkdownFlavor;
}

export function MarkdownFlavorsFixture({ flavor = "gfm" }: MarkdownFlavorsFixtureProps) {
  const [markdownOutput, setMarkdownOutput] = useState("");

  const editor = useVizelEditor({
    flavor,
    features: {
      callout: true,
    },
  });

  const handleExport = () => {
    if (editor) {
      const md = editor.getMarkdown();
      setMarkdownOutput(md);
    }
  };

  const handleInsertCallout = () => {
    if (editor) {
      editor
        .chain()
        .focus()
        .setCallout({ type: "info" })
        .insertContent("Test callout content")
        .run();
    }
  };

  const handleImportCalloutGfm = () => {
    if (editor) {
      editor.commands.setContent("> [!NOTE]\n> GFM callout content", {
        contentType: "markdown",
      });
    }
  };

  const handleImportCalloutObsidian = () => {
    if (editor) {
      editor.commands.setContent("> [!note]\n> Obsidian callout content", {
        contentType: "markdown",
      });
    }
  };

  const handleImportCalloutDocusaurus = () => {
    if (editor) {
      editor.commands.setContent(":::info\nDocusaurus callout content\n:::", {
        contentType: "markdown",
      });
    }
  };

  return (
    <VizelProvider editor={editor}>
      <div className="toolbar">
        <button type="button" data-testid="insert-callout" onClick={handleInsertCallout}>
          Insert Callout
        </button>
        <button type="button" data-testid="export-button" onClick={handleExport}>
          Export
        </button>
        <button type="button" data-testid="import-callout-gfm" onClick={handleImportCalloutGfm}>
          Import GFM Callout
        </button>
        <button
          type="button"
          data-testid="import-callout-obsidian"
          onClick={handleImportCalloutObsidian}
        >
          Import Obsidian Callout
        </button>
        <button
          type="button"
          data-testid="import-callout-docusaurus"
          onClick={handleImportCalloutDocusaurus}
        >
          Import Docusaurus Callout
        </button>
      </div>
      <VizelEditor />
      <pre data-testid="markdown-output">{markdownOutput}</pre>
    </VizelProvider>
  );
}
