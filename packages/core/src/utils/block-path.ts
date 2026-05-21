import type { Editor } from "@tiptap/core";

/**
 * A single segment of a block path produced by {@link getVizelBlockPath}.
 *
 * Each segment describes one ancestor node between the document root and
 * the cursor block, recorded in walk order (root first, current block
 * last). The segment is intentionally lightweight: callers that need the
 * underlying ProseMirror node can re-resolve from `editor.state.doc` at
 * `pos`.
 */
export interface VizelBlockPathSegment {
  /** ProseMirror node-type name (e.g. `"doc"`, `"bulletList"`, `"paragraph"`). */
  readonly nodeType: string;
  /** Document position where the node starts (`$from.start(depth)`-style). */
  readonly pos: number;
  /**
   * Frozen shallow copy of the node's attrs, or `undefined` when the node
   * carries no attributes. The object is `Object.freeze`d to discourage
   * mutation; ProseMirror's own attrs are never mutated through this path.
   */
  readonly attrs?: Readonly<Record<string, unknown>>;
}

/**
 * Walk from the document root to the cursor block and return the path.
 *
 * The path's first segment is always the document root (`doc`) at position
 * `0`; subsequent segments descend through each container until they reach
 * the block that contains the cursor. The last segment corresponds to
 * `editor.state.selection.$from` at the resolved position's deepest level.
 *
 * The function is pure: it reads `editor.state.selection.$from` and the
 * underlying document, and never mutates editor state.
 *
 * @example
 * ```ts
 * const path = getVizelBlockPath(editor);
 * for (const segment of path) {
 *   console.log(segment.nodeType, "@", segment.pos);
 * }
 * ```
 */
export function getVizelBlockPath(editor: Editor): readonly VizelBlockPathSegment[] {
  const { $from } = editor.state.selection;
  const segments: VizelBlockPathSegment[] = [];

  // Walk every ancestor from depth 0 (the doc) down to the current depth.
  // `$from.node(depth)` returns the node at that level; `$from.before(depth)`
  // returns the document position immediately before that node. For depth 0
  // the doc has no `before` position, so use `0` instead.
  for (let depth = 0; depth <= $from.depth; depth++) {
    const node = $from.node(depth);
    const pos = depth === 0 ? 0 : $from.before(depth);
    const rawAttrs = node.attrs as Record<string, unknown> | undefined;
    const hasAttrs = rawAttrs !== undefined && Object.keys(rawAttrs).length > 0;
    const segment: VizelBlockPathSegment = hasAttrs
      ? {
          nodeType: node.type.name,
          pos,
          attrs: Object.freeze({ ...rawAttrs }),
        }
      : {
          nodeType: node.type.name,
          pos,
        };
    segments.push(segment);
  }

  return segments;
}
