<script setup lang="ts">
import {
  shallowEqualArray,
  useVizelEditor,
  useVizelEditorState,
  VizelEditor,
  VizelProvider,
} from "@vizel/vue";
import { defineComponent, h, watch } from "vue";

const editor = useVizelEditor({ immediatelyRender: false });

// The composable reads context via `inject`, so the consumer runs as
// a child component nested inside `<VizelProvider>`. A single-file
// component keeps the fixture self-contained, mirroring how the React
// and Svelte fixtures separate the provider wrapper from the consumer.
const StateConsumer = defineComponent({
  setup() {
    const editorReady = useVizelEditorState(({ editor }) => editor !== null);

    // Read the transaction directly off the snapshot. The flag flips
    // from `false` to `true` once typing dispatches the first Tiptap
    // transaction; the shared scenario asserts the transition uniformly
    // across all three frameworks.
    const hasTransaction = useVizelEditorState(({ transaction }) => transaction !== null);

    const selectorMetrics = { runs: 0 };
    const selectorRuns = useVizelEditorState(({ editor }) => {
      selectorMetrics.runs += 1;
      return { runs: selectorMetrics.runs, hasEditor: editor !== null };
    });

    // Project onto a frozen tuple compared with `shallowEqualArray`.
    // The composable must keep `.value` referentially stable, so the
    // watcher below fires only on the initial mount.
    const stableProjection = useVizelEditorState<readonly string[]>(
      ({ editor }) => (editor === null ? ["idle"] : ["ready"]),
      { equalityFn: shallowEqualArray }
    );

    const consumerMetrics = { runs: 0 };
    watch(
      stableProjection,
      () => {
        consumerMetrics.runs += 1;
      },
      { immediate: true }
    );

    return () => [
      h("div", { "data-testid": "editor-ready" }, String(editorReady.value)),
      h("div", { "data-testid": "selector-runs" }, String(selectorRuns.value.runs)),
      h("div", { "data-testid": "consumer-runs" }, String(consumerMetrics.runs)),
      h("div", { "data-testid": "has-transaction" }, String(hasTransaction.value)),
    ];
  },
});
</script>

<template>
  <VizelProvider :editor="editor">
    <StateConsumer />
    <VizelEditor />
  </VizelProvider>
</template>
