<script setup lang="ts">
import {
  buildVizelMinimapSpec,
  createVizelPageScrollListener,
  type Editor,
  renderVizelMinimapToCanvas,
} from "@vizel/core";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useVizelState } from "../composables/useVizelState.ts";

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

const props = withDefaults(defineProps<VizelMinimapProps>(), {
  width: 120,
  height: 400,
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const rafState: { handle: number | null } = { handle: null };

// Subscribe to editor transactions so we redraw on every doc mutation.
// The returned tick value is intentionally unused.
const tick = useVizelState(() => props.editor);
const editorRef = computed(() => props.editor);

function redraw() {
  const editor = props.editor;
  if (!editor) return;
  if (rafState.handle !== null) return;
  rafState.handle = requestAnimationFrame(() => {
    rafState.handle = null;
    const canvas = canvasRef.value;
    if (!canvas) return;
    const spec = buildVizelMinimapSpec(editor);
    renderVizelMinimapToCanvas(canvas, spec);
  });
}

const scrollListener = createVizelPageScrollListener(redraw);
onMounted(() => {
  redraw();
  // Track page scroll / resize so the minimap viewport highlight
  // stays aligned when the editor sits at its natural height and the
  // page scrolls around it. The Core controller owns the
  // `addEventListener` calls so this composable stays free of direct
  // DOM subscriptions.
  scrollListener.mount();
});
onBeforeUnmount(() => {
  scrollListener.unmount();
  if (rafState.handle !== null) {
    cancelAnimationFrame(rafState.handle);
    rafState.handle = null;
  }
});

// Re-render when the editor instance changes or when transactions arrive.
watch([editorRef, tick], redraw);

function focusBlockAtY(clientY: number) {
  const editor = props.editor;
  if (!editor) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
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

<template>
  <canvas
    ref="canvasRef"
    :width="props.width"
    :height="props.height"
    :class="['vizel-minimap', props.class]"
    @pointerdown="handlePointerDown"
    @wheel="handleWheel"
  />
</template>
