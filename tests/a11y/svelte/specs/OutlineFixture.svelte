<script lang="ts">
import { createVizelEditor, VizelEditor, VizelOutline, VizelProvider } from "@vizel/svelte";

// Outline fixture for the a11y suite. Seeds the editor with several
// headings so `VizelOutline` renders a non-empty list — the empty
// state has nothing for axe-core to scan.
const editor = createVizelEditor({
  initialContent: "<h1>First</h1><h2>Second</h2><h3>Third</h3><p>Body text.</p>",
});
</script>

<VizelProvider editor={editor.current}>
  <VizelOutline />
  <VizelEditor />
</VizelProvider>
