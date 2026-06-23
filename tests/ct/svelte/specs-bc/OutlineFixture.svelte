<script lang="ts">
import {
  createVizelEditor,
  createVizelState,
  VizelEditor,
  VizelOutline,
  VizelProvider,
} from "@vizel/svelte";

const editor = createVizelEditor({
  immediatelyRender: false,
});

const stateRune = createVizelState(() => editor.current);

const cursorPos = $derived.by(() => {
  void stateRune.version;
  return editor.current ? editor.current.state.selection.from : 0;
});
</script>

<VizelProvider editor={editor.current}>
  <div data-testid="cursor-pos">{cursorPos}</div>
  <VizelOutline />
  <VizelEditor />
</VizelProvider>
