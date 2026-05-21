<script lang="ts" module>
import type { Editor } from "@vizel/core";

export interface VizelMinimapProps {
  /** The Tiptap editor instance, or `null` while the editor is initializing. */
  editor: Editor | null;
  /** Custom class name applied to the wrapping `<canvas>`. */
  class?: string;
  /** Canvas pixel width. Defaults to 120. */
  width?: number;
  /** Canvas pixel height. Defaults to 400. */
  height?: number;
}
</script>

<script lang="ts">
import { buildVizelMinimapSpec, renderVizelMinimapToCanvas } from "@vizel/core";
import { createVizelState } from "../runes/createVizelState.svelte.js";

let { editor, class: className, width = 120, height = 400 }: VizelMinimapProps = $props();

let canvasRef: HTMLCanvasElement | null = $state(null);
let rafHandle: number | null = null;

// Subscribe to editor transactions so we redraw on every doc mutation.
// The version counter is read inside $effect to register the dependency.
const tickRune = createVizelState(() => editor);

function redraw() {
  if (!editor) return;
  if (rafHandle !== null) return;
  rafHandle = requestAnimationFrame(() => {
    rafHandle = null;
    if (!canvasRef) return;
    const spec = buildVizelMinimapSpec(editor as Editor);
    renderVizelMinimapToCanvas(canvasRef, spec);
  });
}

$effect(() => {
  // Touch reactive sources so this effect re-runs on every transaction
  // and whenever the canvas mounts or the editor swaps.
  void tickRune.version;
  void editor;
  void canvasRef;
  redraw();
  return () => {
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
  };
});

function focusBlockAtY(clientY: number) {
  if (!editor) return;
  if (!canvasRef) return;
  const rect = canvasRef.getBoundingClientRect();
  const ratio = (clientY - rect.top) / Math.max(1, rect.height);
  const clamped = Math.max(0, Math.min(1, ratio));
  const spec = buildVizelMinimapSpec(editor);
  if (spec.blocks.length === 0) return;
  const index = Math.min(spec.blocks.length - 1, Math.floor(clamped * spec.blocks.length));
  const block = spec.blocks[index];
  if (!block) return;
  editor.commands.focus(block.pos);
  editor.commands.scrollIntoView();
}

function handlePointerDown(event: PointerEvent) {
  focusBlockAtY(event.clientY);
}

function handleWheel(event: WheelEvent) {
  focusBlockAtY(event.clientY + event.deltaY);
}
</script>

<canvas
  bind:this={canvasRef}
  {width}
  {height}
  class={`vizel-minimap ${className || ""}`}
  onpointerdown={handlePointerDown}
  onwheel={handleWheel}
></canvas>
