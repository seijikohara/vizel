<script lang="ts">
import {
  createVizelEditor,
  createVizelState,
  VizelBubbleMenu,
  VizelEditor,
  VizelProvider,
  vizelDefaultFeatures,
} from "@vizel/svelte";

// Fixture for host-CSS-reset scenarios. See the React CssResetFixture for the
// rationale: curated features plus the editor exposed on window for rich seeding.
interface TestWindow extends Window {
  vizelTestEditor?: unknown;
}

const editor = createVizelEditor({
  immediatelyRender: false,
  features: vizelDefaultFeatures(),
});
createVizelState(() => editor.current);

$effect(() => {
  if (editor.current) {
    (window as unknown as TestWindow).vizelTestEditor = editor.current;
  }
  return () => {
    delete (window as unknown as TestWindow).vizelTestEditor;
  };
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
  <VizelBubbleMenu />
</VizelProvider>
