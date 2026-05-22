import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * One row in the document outline used by `VizelMinimap`.
 *
 * The minimap renderer draws a rectangle per spec entry; the rectangle's
 * vertical extent is proportional to `approxHeight`, the horizontal extent
 * is scaled by `1 / depth`, and `pos` is forwarded back to the editor when
 * the user clicks on the rectangle so we can call
 * `editor.commands.focus(pos)`.
 */
export interface VizelMinimapBlockSpec {
  /** Stable identity for the row (`${type}-${pos}`); used as a React key. */
  readonly key: string;
  /** Underlying ProseMirror node type name (e.g. `paragraph`, `heading`). */
  readonly type: string;
  /** Nesting depth measured from the doc root (top-level blocks = 1). */
  readonly depth: number;
  /** Deterministic pixel estimate of the block's rendered height. */
  readonly approxHeight: number;
  /** Doc-level start position; pass to `editor.commands.focus(pos)`. */
  readonly pos: number;
}

/**
 * Output of {@link buildVizelMinimapSpec}.
 *
 * `viewport` mirrors the editor DOM's scroll window in pixels so the
 * renderer can draw the highlight overlay without re-reading the DOM.
 */
export interface VizelMinimapSpec {
  /** Top-level + nested blocks in document order. */
  readonly blocks: readonly VizelMinimapBlockSpec[];
  /** Visible scroll window of the editor DOM at build time. */
  readonly viewport: {
    /** Top of the visible window in pixels (`view.dom.scrollTop`). */
    readonly top: number;
    /** Bottom of the visible window in pixels. */
    readonly bottom: number;
  };
  /**
   * Full pixel height of the editor DOM at build time (`scrollHeight`).
   *
   * The renderer needs this to translate the pixel-based
   * {@link viewport} window into canvas Y coordinates. Block
   * rectangles are laid out against the sum of
   * {@link VizelMinimapBlockSpec.approxHeight} values, which is a
   * coarser estimate; mixing the two scales caused the viewport
   * overlay to land on the wrong slice of the canvas.
   */
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
 * The numbers are deliberately coarse — the minimap is a visual cue, not
 * a layout mirror — but they are stable so the renderer never reflows on
 * every transaction.
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
 * The walk includes every block-level node (top-level paragraphs, headings,
 * lists, list items, code blocks, embeds, etc.) so the renderer can convey
 * the document's hierarchy. The viewport window comes from the editor
 * DOM's `scrollTop` / `clientHeight`; when the editor view is unavailable
 * (SSR, pre-mount, destroyed editor) we return `{ top: 0, bottom: 0 }`.
 */
export function buildVizelMinimapSpec(editor: Editor): VizelMinimapSpec {
  const blocks: VizelMinimapBlockSpec[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (!node.isBlock) return false;
    if (node.type.name === "doc") return true;
    blocks.push({
      key: `${node.type.name}-${pos}`,
      type: node.type.name,
      depth: editor.state.doc.resolve(pos).depth,
      approxHeight: estimateApproxHeight(node),
      pos,
    });
    return true;
  });

  // SSR guard: `editor.view` is unavailable during server render and
  // before the view mounts. Surface a zero-size viewport so the renderer
  // can still draw block rectangles without touching the DOM.
  const hasWindow = typeof window !== "undefined";
  const view = editor.view;
  const dom = hasWindow && view ? view.dom : null;
  const { top, bottom } = resolveViewportSlice(dom);
  const contentHeight =
    dom instanceof HTMLElement ? Math.max(dom.scrollHeight, dom.offsetHeight) : 0;

  return {
    blocks,
    viewport: { top, bottom },
    contentHeight,
  };
}

/**
 * Compute the slice of the editor DOM that is currently visible.
 *
 * The minimap can be embedded in two layouts:
 *
 * - The editor DOM scrolls internally (a fixed-height container with
 *   `overflow: auto`). The visible slice is just
 *   `[scrollTop, scrollTop + clientHeight)`.
 * - The editor sits at its natural height and the page scrolls around
 *   it. `scrollTop` stays 0 and `clientHeight` covers the entire
 *   document, so the previous version highlighted everything as
 *   visible. Detect this case by comparing `scrollHeight` against
 *   `clientHeight` and fall back to intersecting the editor's bounding
 *   rectangle with the window.
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
