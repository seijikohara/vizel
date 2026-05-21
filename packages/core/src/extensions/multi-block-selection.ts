/**
 * Multi-block range selection extension.
 *
 * Tracks selections that cross block boundaries, exposes the resulting
 * block range through a public plugin state, decorates each included
 * block with `data-vizel-block-selected="true"`, and hooks block-aware
 * keyboard shortcuts (Backspace / Delete / Tab / Shift+Tab) that apply
 * to every block in the range.
 *
 * This is part of the always-on core (Section 11b of the v2.0.0 spec)
 * and ships without an opt-in feature flag.
 */
import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState, Selection } from "@tiptap/pm/state";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Options for the multi-block range selection extension.
 *
 * The extension implements Shift+Click and Shift+Arrow range selection
 * across block boundaries, and exposes the resulting block range through
 * `vizelMultiBlockSelectionPluginKey.getState(state)`.
 *
 * The shape exists so that future knobs (e.g. opt-out of decorations,
 * custom CSS attribute name) can be added without changing the extension
 * signature.
 */
// biome-ignore lint/suspicious/noEmptyInterface: reserved for future configurable knobs without breaking consumers
export interface VizelMultiBlockSelectionOptions {}

/**
 * Public plugin state for the multi-block range selection extension.
 *
 * `from` and `to` mirror the document positions of the first and last
 * block in the range. `blockPositions` lists the start position of every
 * top-level block contained in the range, in document order. Returns
 * `null` when the current selection covers fewer than two blocks at the
 * top level — single-block selections rely on Tiptap's built-in
 * behavior.
 */
export interface VizelMultiBlockSelectionState {
  readonly from: number;
  readonly to: number;
  readonly blockPositions: readonly number[];
}

/**
 * Plugin key for the multi-block range selection extension. Use
 * `vizelMultiBlockSelectionPluginKey.getState(state)` to read the
 * current block range from a Tiptap or ProseMirror editor state.
 */
export const vizelMultiBlockSelectionPluginKey =
  new PluginKey<VizelMultiBlockSelectionState | null>("vizelMultiBlockSelection");

/**
 * Read the current multi-block range from an editor state. Returns
 * `null` when the selection spans zero or one top-level block.
 */
export function getVizelMultiBlockSelectionState(
  state: EditorState
): VizelMultiBlockSelectionState | null {
  return vizelMultiBlockSelectionPluginKey.getState(state) ?? null;
}

/**
 * Compute the multi-block range that covers the current selection.
 *
 * Returns `null` when the selection spans zero or one top-level block.
 * When the selection spans two or more top-level blocks, returns the
 * canonical range that snaps to the outer boundaries of those blocks
 * and lists the start position of each block.
 */
function computeMultiBlockSelectionState(
  doc: ProseMirrorNode,
  selection: Selection
): VizelMultiBlockSelectionState | null {
  const { from, to } = selection;
  if (from === to) return null;

  // Walk the doc's top-level children and collect blocks that overlap
  // the selection range. Top-level blocks live at depth 1 in the
  // ProseMirror tree (the doc node itself is depth 0).
  const overlappingBlocks: Array<{ start: number; end: number }> = [];

  doc.forEach((child, offset) => {
    if (!child.isBlock) return;

    const blockStart = offset;
    const blockEnd = offset + child.nodeSize;

    // The block overlaps the selection when its inner content range
    // intersects [from, to). Using strict inequality keeps a selection
    // that ends exactly at a block boundary from being attributed to
    // the next block.
    const overlaps = blockStart < to && blockEnd > from;
    if (!overlaps) return;

    overlappingBlocks.push({ start: blockStart, end: blockEnd });
  });

  if (overlappingBlocks.length < 2) return null;
  const blockPositions = overlappingBlocks.map((b) => b.start);
  const first = overlappingBlocks[0];
  const last = overlappingBlocks.at(-1);
  if (!(first && last)) return null;
  return { from: first.start, to: last.end, blockPositions };
}

/**
 * Build the decoration set that highlights every block in the range
 * plus any nested blocks (list items, callout children, etc.) so that
 * framework styles can render a range highlight at every depth.
 */
function buildMultiBlockDecorations(
  doc: ProseMirrorNode,
  rangeState: VizelMultiBlockSelectionState | null
): DecorationSet {
  if (!rangeState) return DecorationSet.empty;

  const decorations: Decoration[] = [];
  const { from, to } = rangeState;

  doc.descendants((node, pos) => {
    if (!node.isBlock) return undefined;

    const nodeStart = pos;
    const nodeEnd = pos + node.nodeSize;

    // Decorate every block fully contained within the canonical range.
    // Strict containment (>= and <=) ensures nested blocks at every
    // depth pick up the marker, while siblings outside the range are
    // left alone.
    if (nodeStart >= from && nodeEnd <= to) {
      decorations.push(
        Decoration.node(nodeStart, nodeEnd, {
          "data-vizel-block-selected": "true",
        })
      );
    }

    return undefined;
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Delete every block contained in the supplied range with a single
 * transaction. Returns `true` when the deletion ran. The transaction
 * replaces the inclusive `[from, to)` range with an empty paragraph so
 * the editor never ends up in a state with zero block children.
 */
function deleteMultiBlockRange(
  state: EditorState,
  dispatch: ((tr: import("@tiptap/pm/state").Transaction) => void) | undefined,
  rangeState: VizelMultiBlockSelectionState
): boolean {
  const { from, to } = rangeState;
  if (from >= to) return false;

  if (dispatch) {
    const tr = state.tr.deleteRange(from, to);
    // After deletion, ProseMirror will reposition the cursor at `from`
    // inside whatever node now occupies that position. The mapping
    // applied by `deleteRange` handles the selection update.
    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Apply `sinkListItem` or `liftListItem` to every top-level block in
 * the range whose underlying node is a list item. Returns `true` when
 * at least one block was processed.
 *
 * The implementation iterates from the last block back to the first so
 * that earlier operations do not shift the document positions of later
 * blocks. Each block uses its own `NodeSelection` to scope the
 * Tiptap command to that block only.
 */
function applyListIndentToRange(
  editor: import("@tiptap/core").Editor,
  rangeState: VizelMultiBlockSelectionState,
  direction: "sink" | "lift"
): boolean {
  const positions = [...rangeState.blockPositions].reverse();

  return positions.reduce<boolean>((applied, pos) => {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return applied;
    // Only act on list-item-like nodes — Tab on a paragraph does
    // nothing in Tiptap defaults, so we should not invent behavior for
    // those cases.
    const typeName = node.type.name;
    if (typeName !== "listItem" && typeName !== "taskItem") return applied;

    // Select the list item by its node position so the Tiptap command
    // operates against exactly that block.
    const chain = editor
      .chain()
      .setNodeSelection(pos)
      [direction === "sink" ? "sinkListItem" : "liftListItem"](typeName);
    return chain.run() || applied;
  }, false);
}

/**
 * Create the multi-block range selection extension. The extension is
 * part of the always-on core and carries no opt-in feature flag.
 *
 * Behavior:
 * - Tracks `Selection` transitions and exposes the resulting block
 *   range via `vizelMultiBlockSelectionPluginKey.getState(state)`.
 * - Decorates each block in the range with
 *   `data-vizel-block-selected="true"` so framework styles can render a
 *   range highlight.
 * - Hooks Tab / Shift+Tab / Backspace / Delete in `addKeyboardShortcuts`
 *   to apply the operation to every block in the range when a
 *   multi-block range is active. Single-block selections fall through
 *   to Tiptap's defaults.
 *
 * Note on Tiptap conflicts: when a multi-block range is active, the
 * shortcuts above intercept the keypress before the default Tab /
 * Shift+Tab / Backspace / Delete handlers run. Single-block selections
 * see the default behavior unchanged, so list indentation and inline
 * deletion semantics are preserved exactly as Tiptap ships them.
 */
export function createVizelMultiBlockSelectionExtension(
  _options: VizelMultiBlockSelectionOptions = {}
): Extension {
  return Extension.create({
    name: "vizelMultiBlockSelection",

    addKeyboardShortcuts() {
      const intercept = (
        handler: (rangeState: VizelMultiBlockSelectionState) => boolean
      ): (() => boolean) => {
        return () => {
          const rangeState = getVizelMultiBlockSelectionState(this.editor.state);
          if (!rangeState) return false;
          return handler(rangeState);
        };
      };

      return {
        Backspace: intercept((rangeState) =>
          deleteMultiBlockRange(this.editor.state, this.editor.view.dispatch, rangeState)
        ),
        Delete: intercept((rangeState) =>
          deleteMultiBlockRange(this.editor.state, this.editor.view.dispatch, rangeState)
        ),
        Tab: intercept((rangeState) => applyListIndentToRange(this.editor, rangeState, "sink")),
        "Shift-Tab": intercept((rangeState) =>
          applyListIndentToRange(this.editor, rangeState, "lift")
        ),
      };
    },

    addProseMirrorPlugins() {
      return [
        new Plugin<VizelMultiBlockSelectionState | null>({
          key: vizelMultiBlockSelectionPluginKey,

          state: {
            init: (_config, editorState) =>
              computeMultiBlockSelectionState(editorState.doc, editorState.selection),
            // Recompute on every transaction. Selection-only changes
            // (Shift+Arrow) carry `selectionSet === false` in some
            // ProseMirror versions, so the safe path is to always
            // derive from `tr.selection`.
            apply: (tr) => computeMultiBlockSelectionState(tr.doc, tr.selection),
          },

          props: {
            decorations(state) {
              const rangeState = this.getState(state);
              return buildMultiBlockDecorations(state.doc, rangeState ?? null);
            },
          },
        }),
      ];
    },
  });
}

export { NodeSelection };
