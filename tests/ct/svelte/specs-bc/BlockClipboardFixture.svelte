<script lang="ts">
import { createVizelEditor, createVizelState, VizelEditor, VizelProvider } from "@vizel/svelte";

const editor = createVizelEditor({
  immediatelyRender: false,
});

createVizelState(() => editor.current);

$effect(() => {
  if (editor.current) {
    (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor = editor.current;
  }
  return () => {
    delete (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor;
  };
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
</VizelProvider>
