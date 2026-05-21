<script lang="ts">
import { getVizelMultiBlockSelectionState } from "@vizel/core";
import { createVizelEditor, createVizelState, VizelEditor, VizelProvider } from "@vizel/svelte";

const editor = createVizelEditor({
  immediatelyRender: false,
});

const stateRune = createVizelState(() => editor.current);

// Expose the editor on `window` for Playwright-driven selection setup.
// The scenarios drive selection through Tiptap's command bus because
// synthetic keystrokes for chord combinations behave differently
// across browsers.
$effect(() => {
  if (editor.current) {
    (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor = editor.current;
  }
  return () => {
    delete (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor;
  };
});

const summary = $derived.by(() => {
  void stateRune.version;
  if (!editor.current) return "blocks=0";
  const rangeState = getVizelMultiBlockSelectionState(editor.current.state);
  return rangeState
    ? `blocks=${rangeState.blockPositions.length} from=${rangeState.from} to=${rangeState.to}`
    : "blocks=0";
});
</script>

<VizelProvider editor={editor.current}>
  <div data-testid="multi-block-state">{summary}</div>
  <VizelEditor />
</VizelProvider>
