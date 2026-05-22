<script lang="ts">
import { createVizelEditor, VizelEditor, VizelProvider } from "@vizel/svelte";

// Minimal editor fixture for the a11y suite. Boots the editor with a
// non-empty initial document so axe-core sees the rendered ProseMirror
// tree rather than the placeholder-only state.
const editor = createVizelEditor({
  placeholder: "Type something...",
  initialContent: "<h1>Heading</h1><p>Body text.</p>",
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
</VizelProvider>
