import { useVizelEditor, VizelEditor, VizelOutline, VizelProvider } from "@vizel/react";

/**
 * Outline fixture for the a11y suite. Seeds the editor with several
 * headings so `VizelOutline` renders a non-empty list — the empty
 * state has nothing for axe-core to scan.
 */
export function OutlineFixture() {
  const editor = useVizelEditor({
    initialContent: "<h1>First</h1><h2>Second</h2><h3>Third</h3><p>Body text.</p>",
  });

  return (
    <VizelProvider editor={editor}>
      <VizelOutline />
      <VizelEditor />
    </VizelProvider>
  );
}
