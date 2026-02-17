import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelBlockMenuIconName } from "../icons/types.ts";
import { type VizelNodeTypeOption, vizelDefaultNodeTypes } from "./node-types.ts";

/**
 * A single block menu action definition.
 */
export interface VizelBlockMenuAction {
  /** Unique action identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon name from the Vizel icon system */
  icon: VizelBlockMenuIconName;
  /** Group identifier for visual separation */
  group: string;
  /** Execute the action */
  run: (editor: Editor, pos: number, node: Node) => void;
  /** Check if this action can be executed on the given node */
  isEnabled?: (editor: Editor, node: Node) => boolean;
  /** Optional keyboard shortcut label for tooltip */
  shortcut?: string;
}

/**
 * Event detail for block menu open requests.
 * Dispatched when the drag handle is clicked (not dragged).
 */
export interface VizelBlockMenuOpenDetail {
  /** Editor instance */
  editor: Editor;
  /** Document position of the target block */
  pos: number;
  /** The target block node */
  node: Node;
  /** Bounding rect of the drag handle element for positioning */
  handleRect: DOMRect;
}

/** Custom event name for block menu open requests */
export const VIZEL_BLOCK_MENU_EVENT = "vizel:block-menu-open" as const;

/**
 * Default block menu actions providing common block operations.
 */
export const vizelDefaultBlockMenuActions = [
  {
    id: "delete",
    label: "Delete",
    icon: "trash",
    group: "actions",
    shortcut: "Del",
    run: (editor, pos, node) => {
      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .run();
    },
  },
  {
    id: "duplicate",
    label: "Duplicate",
    icon: "copyPlus",
    group: "actions",
    run: (editor, pos, node) => {
      const insertPos = pos + node.nodeSize;
      editor.chain().focus().insertContentAt(insertPos, node.toJSON()).run();
    },
  },
  {
    id: "copy",
    label: "Copy",
    icon: "clipboard",
    group: "clipboard",
    run: (editor, pos, _node) => {
      // Select the block and copy to clipboard
      editor.chain().focus().setNodeSelection(pos).run();
      document.execCommand("copy");
    },
  },
  {
    id: "cut",
    label: "Cut",
    icon: "scissors",
    group: "clipboard",
    run: (editor, pos, _node) => {
      // Select the block and cut
      editor.chain().focus().setNodeSelection(pos).run();
      document.execCommand("cut");
    },
  },
] satisfies VizelBlockMenuAction[];

/**
 * Create block menu actions with locale-specific labels.
 */
export function createVizelBlockMenuActions(locale: VizelLocale): VizelBlockMenuAction[] {
  const labels: Record<string, string> = {
    delete: locale.blockMenu.delete,
    duplicate: locale.blockMenu.duplicate,
    copy: locale.blockMenu.copy,
    cut: locale.blockMenu.cut,
  };
  return vizelDefaultBlockMenuActions.map((action) => ({
    ...action,
    label: labels[action.id] ?? action.label,
  }));
}

/**
 * Get the "Turn into" node type options, filtering out the currently active type.
 */
export function getVizelTurnIntoOptions(
  editor: Editor,
  nodeTypes: VizelNodeTypeOption[] = vizelDefaultNodeTypes
): VizelNodeTypeOption[] {
  return nodeTypes.filter((type) => !type.isActive(editor));
}

/**
 * Group block menu actions by their group identifier.
 */
export function groupVizelBlockMenuActions(
  actions: VizelBlockMenuAction[] = vizelDefaultBlockMenuActions
): VizelBlockMenuAction[][] {
  const groups: VizelBlockMenuAction[][] = [];
  let currentGroup: string | null = null;
  let currentActions: VizelBlockMenuAction[] = [];

  for (const action of actions) {
    if (action.group !== currentGroup) {
      if (currentActions.length > 0) {
        groups.push(currentActions);
      }
      currentGroup = action.group;
      currentActions = [];
    }
    currentActions.push(action);
  }

  if (currentActions.length > 0) {
    groups.push(currentActions);
  }

  return groups;
}
