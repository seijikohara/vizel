import {
  buildVizelMinimapSpec,
  createVizelPageScrollListener,
  type Editor,
  renderVizelMinimapToCanvas,
} from "@vizel/core";
import { type PointerEvent, useCallback, useEffect, useRef, type WheelEvent } from "react";
import { useVizelState } from "../hooks/useVizelState.ts";

export interface VizelMinimapProps {
  /** The Tiptap editor instance, or `null` while the editor is initializing. */
  editor: Editor | null;
  /** Custom class name applied to the wrapping `<canvas>`. */
  className?: string;
  /** Canvas pixel width. Defaults to 120. */
  width?: number;
  /** Canvas pixel height. Defaults to 400. */
  height?: number;
}

/**
 * Canvas-based document minimap for React.
 *
 * Draws a colored-rectangle reduction of the entire document via the
 * framework-neutral `renderVizelMinimapToCanvas` helper from
 * `@vizel/core`. Clicking or wheeling on the canvas focuses the
 * corresponding block in the editor.
 */
export function VizelMinimap({ editor, className, width = 120, height = 400 }: VizelMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Subscribe to editor transactions so the canvas redraws on every doc
  // mutation. The tick value is intentionally unused — the subscription
  // alone is what we want.
  useVizelState(editor);

  // Schedule one redraw per animation frame. `redraw` is stable across
  // renders so event handlers keep their identity.
  const redraw = useCallback(() => {
    if (!editor) return;
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const spec = buildVizelMinimapSpec(editor);
      renderVizelMinimapToCanvas(canvas, spec);
    });
  }, [editor]);

  useEffect(() => {
    redraw();
    // When the editor sits at its natural height inside a page that
    // scrolls (rather than an `overflow: auto` container), the visible
    // slice is computed from the editor's bounding rect. That slice
    // changes on every page scroll / window resize, so the minimap
    // must redraw to keep its viewport highlight aligned with the
    // user's actual reading position. Owning that DOM subscription
    // through a Core controller keeps the framework code free of
    // direct `window.addEventListener` calls (architecture rule).
    const scrollListener = createVizelPageScrollListener(redraw);
    scrollListener.mount();
    return () => {
      scrollListener.unmount();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [redraw]);

  // Map a pointer Y inside the canvas to the doc-level position of the
  // nearest block, then focus it.
  const focusBlockAtY = useCallback(
    (clientY: number) => {
      if (!editor) return;
      const canvas = canvasRef.current;
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
    },
    [editor]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      focusBlockAtY(event.clientY);
    },
    [focusBlockAtY]
  );

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLCanvasElement>) => {
      focusBlockAtY(event.clientY + event.deltaY);
    },
    [focusBlockAtY]
  );

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`vizel-minimap ${className || ""}`}
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
    />
  );
}
