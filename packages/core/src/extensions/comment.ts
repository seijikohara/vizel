import { Mark } from "@tiptap/core";
import type { MarkType } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Options for the comment mark extension
 */
export interface VizelCommentMarkOptions {
  /** Additional HTML attributes for comment marks */
  HTMLAttributes?: Record<string, string>;
  /** Callback when a comment mark is clicked */
  onCommentClick?: (commentId: string) => void;
}

/**
 * Plugin state for tracking the active comment
 */
export interface VizelCommentPluginState {
  /** Currently active (selected) comment ID */
  activeCommentId: string | null;
}

type VizelCommentMeta = { type: "setActive"; commentId: string | null };

/**
 * Plugin key for accessing comment plugin state
 */
export const vizelCommentPluginKey = new PluginKey<VizelCommentPluginState>("vizelComment");

/**
 * Get the current comment plugin state from the editor
 */
export function getVizelCommentPluginState(state: EditorState): VizelCommentPluginState | null {
  return vizelCommentPluginKey.getState(state) ?? null;
}

function isCommentMeta(value: unknown): value is VizelCommentMeta {
  return typeof value === "object" && value !== null && "type" in value;
}

/**
 * Find all text ranges with a specific comment mark
 */
function findCommentMarkPositions(
  state: EditorState,
  commentId: string,
  markType: MarkType
): { from: number; to: number }[] {
  const positions: { from: number; to: number }[] = [];

  state.doc.descendants((node, pos) => {
    if (!node.isText) return true;

    for (const mark of node.marks) {
      if (mark.type === markType && mark.attrs.commentId === commentId) {
        positions.push({ from: pos, to: pos + node.nodeSize });
        break;
      }
    }
    return true;
  });

  return positions;
}

/**
 * Comment mark extension for highlighting annotated text.
 *
 * @example
 * ```typescript
 * import { VizelCommentMark } from "@vizel/core";
 *
 * const extensions = [
 *   VizelCommentMark.configure({
 *     onCommentClick: (commentId) => console.log("Clicked:", commentId),
 *   }),
 * ];
 * ```
 */
export const VizelCommentMark = Mark.create<VizelCommentMarkOptions>({
  name: "vizelComment",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-vizel-comment-id"),
        renderHTML: (attributes) => {
          if (!attributes.commentId) return {};
          return { "data-vizel-comment-id": attributes.commentId as string };
        },
      },
    };
  },

  inclusive: false,
  spanning: true,

  parseHTML() {
    return [{ tag: "span[data-vizel-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
        class: "vizel-comment-marker",
      },
      0,
    ];
  },

  addCommands() {
    return {
      addCommentMark:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId });
        },

      removeCommentMark:
        (commentId: string) =>
        ({ state, dispatch }) => {
          if (!dispatch) return true;

          const markType = state.schema.marks[this.name];
          if (!markType) return false;

          const positions = findCommentMarkPositions(state, commentId, markType);
          if (positions.length === 0) return false;

          let tr = state.tr;
          for (let i = positions.length - 1; i >= 0; i -= 1) {
            const pos = positions[i];
            if (pos) {
              tr = tr.removeMark(pos.from, pos.to, markType.create({ commentId }));
            }
          }

          dispatch(tr);
          return true;
        },

      setActiveComment:
        (commentId: string | null) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            dispatch(tr.setMeta(vizelCommentPluginKey, { type: "setActive", commentId }));
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options;
    const markName = this.name;

    return [
      new Plugin<VizelCommentPluginState>({
        key: vizelCommentPluginKey,

        state: {
          init: () => ({ activeCommentId: null }),
          apply: (tr, value) => {
            const meta = tr.getMeta(vizelCommentPluginKey);
            if (isCommentMeta(meta)) {
              return { ...value, activeCommentId: meta.commentId };
            }
            return value;
          },
        },

        props: {
          handleClick: (_view, _pos, event) => {
            const target = event.target as HTMLElement;
            const commentEl = target.closest("[data-vizel-comment-id]");
            if (commentEl) {
              const commentId = commentEl.getAttribute("data-vizel-comment-id");
              if (commentId) {
                extensionOptions.onCommentClick?.(commentId);
                return false;
              }
            }
            return false;
          },

          decorations(state) {
            const pluginState = vizelCommentPluginKey.getState(state);
            if (!pluginState?.activeCommentId) return DecorationSet.empty;

            const markType = state.schema.marks[markName];
            if (!markType) return DecorationSet.empty;

            const positions = findCommentMarkPositions(
              state,
              pluginState.activeCommentId,
              markType
            );
            if (positions.length === 0) return DecorationSet.empty;

            const decorations = positions.map((pos) =>
              Decoration.inline(pos.from, pos.to, {
                class: "vizel-comment-marker--active",
              })
            );

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

/**
 * Create the comment mark extension with configured options
 */
export function createVizelCommentExtension(
  options: VizelCommentMarkOptions = {}
): ReturnType<typeof VizelCommentMark.configure> {
  return VizelCommentMark.configure(options);
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    vizelComment: {
      /** Add a comment mark to the current selection */
      addCommentMark: (commentId: string) => ReturnType;
      /** Remove all comment marks with the given ID */
      removeCommentMark: (commentId: string) => ReturnType;
      /** Set the active (highlighted) comment */
      setActiveComment: (commentId: string | null) => ReturnType;
    };
  }
}
