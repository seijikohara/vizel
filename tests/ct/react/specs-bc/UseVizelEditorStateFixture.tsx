import {
  shallowEqualArray,
  useVizelEditor,
  useVizelEditorState,
  VizelEditor,
  VizelProvider,
} from "@vizel/react";
import { useEffect, useRef, useState } from "react";

export function UseVizelEditorStateFixture() {
  const editor = useVizelEditor({
    immediatelyRender: false,
  });

  return (
    <VizelProvider editor={editor}>
      <Inner />
      <VizelEditor />
    </VizelProvider>
  );
}

// The selector reads from the surrounding `<VizelProvider>` via
// context, so the inner component executes inside that provider.
function Inner() {
  // Track the editor through the selector seam so the test exercises
  // the new `useVizelContextSafe`-backed reactivity path.
  const editorReady = useVizelEditorState(({ editor }) => editor !== null);

  // The transaction tick changes on every Tiptap notification; using
  // `editor === null ? 0 : 1` would short-circuit through `Object.is`,
  // so the selector reaches inside `editor.state` for a value that
  // truly differs after every transaction.
  const transactionTick = useVizelEditorState(({ editor }) =>
    editor === null ? 0 : editor.state.doc.nodeSize
  );

  // Read the transaction directly off the snapshot. The value is `null`
  // before the first Tiptap notification and a `Transaction` afterward,
  // so the flag flips from `false` to `true` once typing dispatches the
  // first transaction. The shared scenario asserts this transition
  // across all three frameworks, proving the selector can read the
  // transaction the React adapter previously withheld.
  const hasTransaction = useVizelEditorState(({ transaction }) => transaction !== null);

  // Count store notifications outside the selector body so the
  // selector itself stays pure and React's `useSyncExternalStore`
  // contract holds across re-renders.
  const selectorRunsRef = useRef(0);
  const [selectorRuns, setSelectorRuns] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the deps drive the run-count bump; the effect intentionally listens to both signals.
  useEffect(() => {
    selectorRunsRef.current += 1;
    setSelectorRuns(selectorRunsRef.current);
  }, [editorReady, transactionTick]);

  // The projection is structurally stable across transactions, so the
  // `shallowEqualArray` short-circuit must keep the returned reference
  // identical and stop the effect below from running.
  const stableProjection = useVizelEditorState<readonly string[]>(
    ({ editor }) => (editor === null ? ["idle"] : ["ready"]),
    { equalityFn: shallowEqualArray }
  );

  // The effect counts how often the consumer reacts to the
  // short-circuited projection. The counter stays at its initial
  // value after the editor mount when the equality short-circuit
  // holds across every keystroke.
  const [consumerRuns, setConsumerRuns] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the test depends on the projection reference identity to detect equalityFn short-circuit; the dependency is intentional.
  useEffect(() => {
    setConsumerRuns((value) => value + 1);
  }, [stableProjection]);

  return (
    <>
      <div data-testid="editor-ready">{String(editorReady)}</div>
      <div data-testid="selector-runs">{selectorRuns}</div>
      <div data-testid="consumer-runs">{consumerRuns}</div>
      <div data-testid="has-transaction">{String(hasTransaction)}</div>
    </>
  );
}
