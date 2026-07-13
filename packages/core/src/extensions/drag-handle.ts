import { Extension } from "@tiptap/core";
import DragHandle from "@tiptap/extension-drag-handle";
import type { Node as PmNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

import { vizelEnLocale } from "../i18n/en.ts";
import type { VizelLocale } from "../i18n/types.ts";
import { renderVizelIcon } from "../icons/types.ts";
import { VIZEL_BLOCK_MENU_EVENT, type VizelBlockMenuOpenDetail } from "./block-menu.ts";
import { getVizelMultiBlockSelectionState } from "./multi-block-selection.ts";

export { DragHandle as VizelDragHandle };

/** Node types that represent individual list items */
const LIST_ITEM_NODE_TYPES = new Set(["listItem", "taskItem"]);

/** Node types that represent list containers */
const LIST_CONTAINER_NODE_TYPES = new Set(["bulletList", "orderedList", "taskList"]);

export interface VizelDragHandleOptions {
  /**
   * Whether to show the drag handle
   * @default true
   */
  enabled?: boolean;
  /**
   * Locale for drag handle UI strings.
   * If not provided, default English strings are used.
   */
  locale?: VizelLocale;
}

/** Threshold in pixels to distinguish click from drag */
const CLICK_DRAG_THRESHOLD = 5;

/**
 * Creates a DragHandle extension with default styling.
 * The drag handle appears on the left side of blocks when hovering.
 * Clicking (not dragging) the handle opens the block menu.
 */
export function createVizelDragHandleExtension(options: VizelDragHandleOptions = {}): Extension {
  const { enabled = true, locale } = options;

  if (!enabled) {
    return Extension.create({ name: "vizelDragHandleDisabled" });
  }

  // Store references for onNodeChange and click handler
  const handleState: {
    dragHandleElement: HTMLElement | null;
    currentNode: PmNode | null;
    currentPos: number;
    currentEditor: import("@tiptap/core").Editor | null;
  } = {
    dragHandleElement: null,
    currentNode: null,
    currentPos: 0,
    currentEditor: null,
  };

  return DragHandle.configure({
    render() {
      const element = document.createElement("div");
      element.classList.add("vizel-drag-handle");
      element.setAttribute("data-vizel-drag-handle", "");
      element.setAttribute("draggable", "true");
      element.setAttribute(
        "aria-label",
        locale?.dragHandle.ariaLabel ?? vizelEnLocale.dragHandle.ariaLabel
      );
      element.setAttribute("role", "button");

      // Create grip icon using safe template element approach
      const grip = document.createElement("div");
      grip.classList.add("vizel-drag-handle-grip");
      const iconHtml = renderVizelIcon("grip", { width: 14, height: 14 });
      const template = document.createElement("template");
      template.innerHTML = iconHtml;
      grip.appendChild(template.content);
      element.appendChild(grip);

      // Click vs drag detection (mutable across listener invocations).
      const clickDetect = { startX: 0, startY: 0, isDrag: false };

      element.addEventListener("mousedown", (e: MouseEvent) => {
        clickDetect.startX = e.clientX;
        clickDetect.startY = e.clientY;
        clickDetect.isDrag = false;
      });

      element.addEventListener("mousemove", (e: MouseEvent) => {
        if (
          Math.abs(e.clientX - clickDetect.startX) + Math.abs(e.clientY - clickDetect.startY) >
          CLICK_DRAG_THRESHOLD
        ) {
          clickDetect.isDrag = true;
        }
      });

      element.addEventListener("mouseup", () => {
        if (
          !clickDetect.isDrag &&
          handleState.currentNode &&
          handleState.currentEditor &&
          handleState.dragHandleElement
        ) {
          const handleRect = handleState.dragHandleElement.getBoundingClientRect();
          const detail: VizelBlockMenuOpenDetail = {
            editor: handleState.currentEditor,
            pos: handleState.currentPos,
            node: handleState.currentNode,
            handleRect,
          };
          document.dispatchEvent(new CustomEvent(VIZEL_BLOCK_MENU_EVENT, { detail }));
        }
      });

      handleState.dragHandleElement = element;

      return element;
    },
    onNodeChange({ node, editor, ...rest }) {
      handleState.currentNode = node ?? null;
      // The drag-handle plugin passes pos at runtime but the public type omits it
      handleState.currentPos = (rest as { pos?: number }).pos ?? 0;
      handleState.currentEditor = editor;

      // Toggle visibility class based on whether a node is being targeted
      if (handleState.dragHandleElement) {
        if (node) {
          handleState.dragHandleElement.classList.add("is-visible");

          // Add list-specific class for styling adjustments
          const isListContainer = LIST_CONTAINER_NODE_TYPES.has(node.type.name);
          const isListItem = LIST_ITEM_NODE_TYPES.has(node.type.name);
          handleState.dragHandleElement.classList.toggle(
            "is-list-target",
            isListContainer || isListItem
          );
          // Bullet and ordered list items render their marker in the parent
          // list's padding area, which the default left placement of the
          // handle overlaps. Mark these items so CSS can shift the handle
          // further left past the marker. Task items render their checkbox
          // inside the li content and do not need the shift.
          handleState.dragHandleElement.classList.toggle(
            "is-marker-list-target",
            node.type.name === "listItem"
          );
        } else {
          handleState.dragHandleElement.classList.remove(
            "is-visible",
            "is-list-target",
            "is-marker-list-target"
          );
        }
      }
    },
    computePositionConfig: {
      placement: "left",
    },
    // Enable per-item dragging for nested content (list items, task items,
    // and other nested blocks). Disable edge detection so the handle does
    // not switch to the parent when the cursor approaches the left edge
    // of a nested block; otherwise moving the mouse toward the handle
    // itself (which sits to the left of the block) triggers the parent
    // preference and swaps the handle out from under the cursor.
    nested: {
      edgeDetection: "none",
    },
    onElementDragStart() {
      // Multi-block forwarding. When a multi-block range
      // is active and the drag handle's current node falls inside that
      // range, expand the editor selection to cover the entire range
      // before the underlying `dragHandler` runs. `dragHandler` checks
      // whether its target node is contained in the current selection
      // and, when it is, uses the full selection as the dragged
      // payload — so the resulting drop moves every block in the range
      // together in a single transaction.
      if (!handleState.currentEditor) return;
      const rangeState = getVizelMultiBlockSelectionState(handleState.currentEditor.state);
      if (!rangeState) return;
      // Only expand when the dragged block sits inside the multi-block
      // range. Dragging a block outside the range falls back to the
      // single-block move path.
      if (handleState.currentPos < rangeState.from || handleState.currentPos >= rangeState.to)
        return;
      const { doc, tr } = handleState.currentEditor.state;
      try {
        const startPos = doc.resolve(rangeState.from);
        const endPos = doc.resolve(rangeState.to);
        handleState.currentEditor.view.dispatch(
          tr.setSelection(new TextSelection(startPos, endPos))
        );
      } catch {
        // Resolving outside the document is a no-op; the single-block
        // path takes over.
      }
    },
    onElementDragEnd() {
      // Tiptap's DragHandlePlugin (v3.22.x) does not clear its internal
      // `currentNode` on drag end. When the user hovers the same node after
      // dropping, the plugin's `targetNode !== currentNode` guard skips the
      // showHandle() call and the inline `visibility: hidden` set during
      // drag remains, leaving the handle invisible until the pointer moves
      // to a different node. Dispatch a synthetic mouseleave on the editor
      // view to force the plugin to reset `currentNode` so the next hover
      // re-triggers detection.
      const view = handleState.currentEditor?.view;
      if (!view) return;
      view.dom.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false, cancelable: true }));
    },
  });
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    vizelBlockMove: {
      /**
       * Move the current block up
       */
      moveBlockUp: () => ReturnType;
      /**
       * Move the current block down
       */
      moveBlockDown: () => ReturnType;
    };
  }
}

import type { Node, ResolvedPos } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";

interface BlockInfo {
  pos: number;
  node: Node;
  depth: number;
}

/** Node types that should be treated as movable blocks */
const MOVABLE_NODE_TYPES = new Set(["listItem", "taskItem"]);

/**
 * Find the movable block at the cursor position.
 * For list items, returns the listItem/taskItem node.
 * For other blocks, returns the top-level block.
 */
function findMovableBlock($pos: ResolvedPos): BlockInfo | null {
  // Walk up from the cursor position to find a movable block
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    const nodeType = node.type.name;

    // Check if this is a list item (listItem or taskItem)
    if (MOVABLE_NODE_TYPES.has(nodeType)) {
      return {
        pos: $pos.before(depth),
        node,
        depth,
      };
    }
  }

  // Default: return the block at depth 1 (top-level block)
  if ($pos.depth >= 1) {
    const node = $pos.node(1);
    return {
      pos: $pos.before(1),
      node,
      depth: 1,
    };
  }

  return null;
}

/**
 * Find the position of the previous sibling block
 */
function findPreviousSiblingInfo(
  state: EditorState,
  blockInfo: BlockInfo
): { pos: number; node: Node } | null {
  const resolvedPos = state.doc.resolve(blockInfo.pos);
  const parentDepth = resolvedPos.depth;
  const parentStart = resolvedPos.start(parentDepth);
  const parent = resolvedPos.parent;

  // Compute cumulative offsets for each child index so we can find the
  // matching index without mutable accumulators.
  const childOffsets = Array.from({ length: parent.childCount + 1 }, (_, i) =>
    // oxlint-disable-next-line no-shadow -- nested throwaway index parameters conventionally reuse `_`
    Array.from({ length: i }, (_, j) => parent.child(j).nodeSize).reduce(
      (sum, size) => sum + size,
      parentStart
    )
  );
  const currentIndex = childOffsets.indexOf(blockInfo.pos);

  // If current node is first child or not found, no previous sibling
  if (currentIndex <= 0) return null;

  const prevPos = childOffsets[currentIndex - 1] ?? parentStart;
  return { pos: prevPos, node: parent.child(currentIndex - 1) };
}

/**
 * Find the next sibling block
 */
function findNextSiblingInfo(
  state: EditorState,
  blockInfo: BlockInfo
): { pos: number; node: Node } | null {
  const blockEnd = blockInfo.pos + blockInfo.node.nodeSize;
  const resolvedEnd = state.doc.resolve(blockEnd);

  // Check if we're at the end of the parent
  if (blockEnd >= resolvedEnd.end(resolvedEnd.depth)) return null;

  const nextNode = state.doc.nodeAt(blockEnd);
  if (!nextNode) return null;

  return { pos: blockEnd, node: nextNode };
}

/**
 * Extension for keyboard shortcuts to move blocks up/down.
 * Alt+ArrowUp moves block up, Alt+ArrowDown moves block down.
 * Supports moving list items within their parent list.
 */
export const VizelBlockMoveKeymap = Extension.create({
  name: "vizelBlockMoveKeymap",

  addCommands() {
    return {
      moveBlockUp:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          const blockInfo = findMovableBlock($from);
          if (!blockInfo || blockInfo.pos <= 0) return false;

          const prevSibling = findPreviousSiblingInfo(state, blockInfo);
          if (!prevSibling) return false;

          if (dispatch) {
            const blockEnd = blockInfo.pos + blockInfo.node.nodeSize;
            // Delete the current block
            tr.delete(blockInfo.pos, blockEnd);
            // Insert at the previous sibling's position
            tr.insert(prevSibling.pos, blockInfo.node);
            // Set cursor inside the moved block
            const newPos = prevSibling.pos + 1;
            tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));
          }

          return true;
        },

      moveBlockDown:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          const blockInfo = findMovableBlock($from);
          if (!blockInfo) return false;

          const nextSibling = findNextSiblingInfo(state, blockInfo);
          if (!nextSibling) return false;

          if (dispatch) {
            const blockEnd = blockInfo.pos + blockInfo.node.nodeSize;
            // Delete the current block first
            tr.delete(blockInfo.pos, blockEnd);
            // Calculate new insert position (after the next sibling, adjusted for deletion)
            const insertPos = blockInfo.pos + nextSibling.node.nodeSize;
            tr.insert(insertPos, blockInfo.node);
            // Set cursor inside the moved block
            const newPos = insertPos + 1;
            tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Alt-ArrowUp": () => this.editor.commands.moveBlockUp(),
      "Alt-ArrowDown": () => this.editor.commands.moveBlockDown(),
    };
  },
});

/**
 * Creates the complete drag handle extension set including:
 * - Visual drag handle on block hover
 * - Keyboard shortcuts for block movement (Alt+Up/Down)
 */
export function createVizelDragHandleExtensions(options: VizelDragHandleOptions = {}): Extension[] {
  return [createVizelDragHandleExtension(options), VizelBlockMoveKeymap];
}
