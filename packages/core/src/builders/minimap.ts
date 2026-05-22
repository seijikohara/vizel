import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * One row in the document outline used by `VizelMinimap`.
 *
 * `offsetTop` and `height` are pixel values relative to the editor
 * DOM. They come from `view.coordsAtPos(pos)` when the view is
 * available; on SSR / pre-mount / when `coordsAtPos` throws, the
 * builder falls back to deterministic per-node estimates so a block
 * still gets a non-zero rectangle.
 *
 * `pos` is forwarded back to the editor when the user clicks on the
 * rectangle so we can call `editor.commands.focus(pos)`.
 */
export interface VizelMinimapBlockSpec {
  /** Stable identity for the row (`${type}-${pos}`); used as a React key. */
  readonly key: string;
  /** Underlying ProseMirror node type name (e.g. `paragraph`, `heading`). */
  readonly type: string;
  /** Nesting depth measured from the doc root (top-level blocks = 1). */
  readonly depth: number;
  /** Top of the block in editor DOM pixels. */
  readonly offsetTop: number;
  /** Height of the block in editor DOM pixels. */
  readonly height: number;
  /** Doc-level start position; pass to `editor.commands.focus(pos)`. */
  readonly pos: number;
}

/**
 * Output of {@link buildVizelMinimapSpec}.
 *
 * All numbers share one coordinate system: editor DOM pixels. Block
 * rectangles, the viewport overlay, and `contentHeight` are
 * directly comparable so the renderer can map every value to canvas
 * Y via the same `pixel / contentHeight * canvasHeight` formula.
 */
export interface VizelMinimapSpec {
  /** Top-level + nested blocks in document order. */
  readonly blocks: readonly VizelMinimapBlockSpec[];
  /** Visible scroll window of the editor in editor DOM pixels. */
  readonly viewport: {
    /** Top of the visible window. */
    readonly top: number;
    /** Bottom of the visible window. */
    readonly bottom: number;
  };
  /** Full pixel height of the editor (`scrollHeight`). */
  readonly contentHeight: number;
}

/** Deterministic height estimate per heading level (1..6). */
const HEADING_HEIGHT_BY_LEVEL: Readonly<Record<number, number>> = {
  1: 56,
  2: 44,
  3: 32,
  4: 32,
  5: 32,
  6: 32,
};

/** Height per child row inside a list-like container. */
const LIST_ROW_HEIGHT = 24;

/**
 * Return the deterministic pixel estimate for a single ProseMirror node.
 *
 * Only used as a fallback when `coordsAtPos` is unavailable (SSR,
 * pre-mount). The live path uses real DOM measurements.
 */
function estimateApproxHeight(node: ProseMirrorNode): number {
  const typeName = node.type.name;
  if (typeName === "paragraph") return 24;
  if (typeName === "heading") {
    const levelAttr = node.attrs.level;
    const level = typeof levelAttr === "number" ? levelAttr : 1;
    return HEADING_HEIGHT_BY_LEVEL[level] ?? 32;
  }
  if (typeName === "bulletList" || typeName === "orderedList" || typeName === "taskList") {
    return Math.max(LIST_ROW_HEIGHT, node.childCount * LIST_ROW_HEIGHT);
  }
  if (typeName === "codeBlock") return 100;
  if (
    typeName === "image" ||
    typeName === "embed" ||
    typeName === "diagram" ||
    typeName === "mathBlock"
  ) {
    return 200;
  }
  return 32;
}

/**
 * Walk `editor.state.doc` and collect a `VizelMinimapSpec`.
 *
 * Live block geometry comes from `view.coordsAtPos`, so the minimap
 * mirrors what the user actually sees. When the view is unavailable
 * (SSR, pre-mount, destroyed editor) we fall back to deterministic
 * height estimates and lay blocks out sequentially from y=0; the
 * canvas still renders without throwing.
 */
export function buildVizelMinimapSpec(editor: Editor): VizelMinimapSpec {
  const blocks: VizelMinimapBlockSpec[] = [];
  const view = typeof window === "undefined" ? null : editor.view;
  const editorTop = view?.dom instanceof HTMLElement ? view.dom.getBoundingClientRect().top : 0;
  const layoutState = { fallbackY: 0 };

  editor.state.doc.descendants((node, pos) => {
    if (!node.isBlock) return false;
    if (node.type.name === "doc") return true;
    const { offsetTop, height } = measureBlockGeometry(view, editorTop, node, pos, layoutState);
    blocks.push({
      key: `${node.type.name}-${pos}`,
      type: node.type.name,
      depth: editor.state.doc.resolve(pos).depth,
      offsetTop,
      height,
      pos,
    });
    return true;
  });

  const dom = view?.dom instanceof HTMLElement ? view.dom : null;
  const { top, bottom } = resolveViewportSlice(dom);
  const contentHeight = dom ? Math.max(dom.scrollHeight, dom.offsetHeight) : layoutState.fallbackY;

  return {
    blocks,
    viewport: { top, bottom },
    contentHeight,
  };
}

/**
 * Resolve a block's `(offsetTop, height)` in editor DOM pixels.
 *
 * Uses `view.coordsAtPos` (viewport-relative window coordinates)
 * shifted by the editor DOM's own top so the resulting pixels are
 * measured from the editor's content origin. `coordsAtPos` can
 * throw when the node has not been laid out yet; on failure (or when
 * the view is unavailable) the fallback path advances a deterministic
 * y-cursor by `estimateApproxHeight(node)`.
 */
function measureBlockGeometry(
  view: Editor["view"] | null,
  editorTop: number,
  node: ProseMirrorNode,
  pos: number,
  layoutState: { fallbackY: number }
): { offsetTop: number; height: number } {
  if (view?.dom instanceof HTMLElement) {
    try {
      const start = view.coordsAtPos(pos);
      const end = view.coordsAtPos(pos + Math.max(0, node.nodeSize - 1));
      const offsetTop = Math.max(0, Math.round(start.top - editorTop));
      const height = Math.max(1, Math.round(end.bottom - start.top));
      return { offsetTop, height };
    } catch {
      // Fall through to the deterministic fallback.
    }
  }
  const fallbackHeight = estimateApproxHeight(node);
  const offsetTop = layoutState.fallbackY;
  layoutState.fallbackY += fallbackHeight;
  return { offsetTop, height: fallbackHeight };
}

/**
 * Compute the slice of the editor DOM that is currently visible.
 *
 * The minimap can be embedded in two layouts:
 *
 * - The editor DOM scrolls internally (a fixed-height container with
 *   `overflow: auto`). The visible slice is just
 *   `[scrollTop, scrollTop + clientHeight)`.
 * - The editor sits at its natural height and the page scrolls
 *   around it. `scrollTop` stays 0 and `clientHeight` covers the
 *   entire document, so falling back on those values would highlight
 *   everything as visible. Detect this case by comparing
 *   `scrollHeight` against `clientHeight` and intersect the editor's
 *   bounding rectangle with the window instead.
 */
function resolveViewportSlice(dom: HTMLElement | null): { top: number; bottom: number } {
  if (!(dom instanceof HTMLElement)) return { top: 0, bottom: 0 };

  const scrollsInternally = dom.scrollHeight - dom.clientHeight > 1;
  if (scrollsInternally) {
    return { top: dom.scrollTop, bottom: dom.scrollTop + dom.clientHeight };
  }

  if (typeof window === "undefined") {
    return { top: 0, bottom: dom.clientHeight };
  }

  const rect = dom.getBoundingClientRect();
  const editorHeight = dom.offsetHeight;
  const windowHeight = window.innerHeight;
  const top = Math.max(0, Math.min(editorHeight, -rect.top));
  const bottom = Math.max(0, Math.min(editorHeight, windowHeight - rect.top));
  return { top, bottom };
}
