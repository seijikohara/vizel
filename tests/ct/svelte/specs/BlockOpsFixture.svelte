<script lang="ts">
import {
  createVizelEditor,
  createVizelState,
  VizelEditor,
  VizelProvider,
  vizelBlockOperationCommands,
} from "@vizel/svelte";

interface TestWindow extends Window {
  vizelTestEditor?: unknown;
  vizelBlockOperationCommands?: unknown;
}

const editor = createVizelEditor({
  immediatelyRender: false,
});
createVizelState(() => editor.current);

$effect(() => {
  if (editor.current) {
    const win = window as unknown as TestWindow;
    win.vizelTestEditor = editor.current;
    win.vizelBlockOperationCommands = vizelBlockOperationCommands;
  }
  return () => {
    const win = window as unknown as TestWindow;
    delete win.vizelTestEditor;
    delete win.vizelBlockOperationCommands;
  };
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
</VizelProvider>
