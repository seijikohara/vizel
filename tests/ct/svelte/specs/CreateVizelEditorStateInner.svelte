<script lang="ts">
import { createVizelEditorState, shallowEqualArray } from "@vizel/svelte";
import { untrack } from "svelte";

// The rune reads context via `getContext`, so the consumer runs inside
// a child component that mounts under `<VizelProvider>`. The parent
// fixture instantiates the editor and renders this component as a
// child of the provider.
const editorReady = createVizelEditorState(({ editor }) => editor !== null);

// Plain object holds the selector-run counter so the rune itself drives
// the increment; the counter strictly grows on every Tiptap transaction
// (no `let` needed at module scope).
const selectorMetrics = { runs: 0 };
const selectorRuns = createVizelEditorState(({ editor }) => {
  selectorMetrics.runs += 1;
  return { runs: selectorMetrics.runs, hasEditor: editor !== null };
});

// Project onto a frozen tuple compared by `shallowEqualArray`. The
// rune must keep `.current` referentially stable across transactions,
// so the `$effect` below runs only once for the initial mount.
const stableProjection = createVizelEditorState(
  ({ editor }) => (editor === null ? ["idle"] : ["ready"]) as readonly string[],
  { equalityFn: shallowEqualArray }
);

// Track consumer-effect runs through a `$state` counter, which the
// template reads directly. The effect writes the counter through an
// `untrack` boundary to keep the write outside its own dependency
// graph; without that boundary, the write re-triggers the effect and
// Svelte raises `effect_update_depth_exceeded`.
let consumerRuns = $state(0);
$effect(() => {
  // Reading `.current` registers the dependency; the body counts the
  // consumer-effect runs the equality short-circuit suppresses.
  void stableProjection.current;
  untrack(() => {
    consumerRuns += 1;
  });
});
</script>

<div data-testid="editor-ready">{String(editorReady.current)}</div>
<div data-testid="selector-runs">{selectorRuns.current.runs}</div>
<div data-testid="consumer-runs">{consumerRuns}</div>
