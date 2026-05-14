import {
  createVizelCommentHandlers,
  type Editor,
  VIZEL_DEFAULT_COMMENT_OPTIONS,
  type VizelComment,
  type VizelCommentOptions,
  type VizelCommentReply,
  type VizelCommentState,
} from "@vizel/core";
import { type ComputedRef, computed, shallowReactive, watch } from "vue";

/**
 * Comment composable result
 */
export interface UseVizelCommentResult {
  /** All stored comments (newest first) */
  comments: ComputedRef<VizelComment[]>;
  /** Currently active comment ID */
  activeCommentId: ComputedRef<string | null>;
  /** Whether comments are loading */
  isLoading: ComputedRef<boolean>;
  /** Last error that occurred */
  error: ComputedRef<Error | null>;
  /** Add a comment to the current selection */
  addComment: (text: string, author?: string) => Promise<VizelComment | null>;
  /** Remove a comment and its mark */
  removeComment: (commentId: string) => Promise<void>;
  /** Mark a comment as resolved */
  resolveComment: (commentId: string) => Promise<boolean>;
  /** Reopen a resolved comment */
  reopenComment: (commentId: string) => Promise<boolean>;
  /** Add a reply to a comment */
  replyToComment: (
    commentId: string,
    text: string,
    author?: string
  ) => Promise<VizelCommentReply | null>;
  /** Set the active comment */
  setActiveComment: (commentId: string | null) => void;
  /** Load all comments from storage */
  loadComments: () => Promise<VizelComment[]>;
  /** Get a comment by its ID */
  getCommentById: (commentId: string) => VizelComment | undefined;
}

/**
 * Composable for managing document comments and annotations.
 *
 * @param getEditor - Function that returns the editor instance
 * @param options - Comment configuration options
 * @returns Comment state and controls
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useVizelEditor, useVizelComment } from "@vizel/vue";
 *
 * const editor = useVizelEditor({ features: { comment: true } });
 * const { comments, addComment, resolveComment, setActiveComment } =
 *   useVizelComment(() => editor.value, { key: "my-comments" });
 * </script>
 * ```
 */
export function useVizelComment(
  getEditor: () => Editor | null | undefined,
  options: VizelCommentOptions = {}
): UseVizelCommentResult {
  const enabled = options.enabled ?? VIZEL_DEFAULT_COMMENT_OPTIONS.enabled;
  const storage = options.storage ?? VIZEL_DEFAULT_COMMENT_OPTIONS.storage;
  const key = options.key ?? VIZEL_DEFAULT_COMMENT_OPTIONS.key;

  // `shallowReactive` avoids deep-proxying `Error` instances and comment
  // arrays in the state shape. The fields are reassigned, never deeply
  // mutated, so shallow reactivity is sufficient and cheaper.
  const state = shallowReactive<VizelCommentState>({
    comments: [],
    activeCommentId: null,
    isLoading: false,
    error: null,
  });

  const handleStateChange = (partial: Partial<VizelCommentState>) => {
    Object.assign(state, partial);
  };

  // Comment handlers use `getEditor` lazily, so editor swaps are handled
  // automatically without re-instantiating them. Options are captured at
  // composable call time (consistent with how `useVizelEditor` treats its
  // options as mount-time); a previous `watch` on options never fired because
  // the destructured locals aren't reactive, and has been removed.
  const handlers = createVizelCommentHandlers(
    getEditor,
    {
      enabled,
      storage,
      key,
      onAdd: (comment) => options.onAdd?.(comment),
      onRemove: (id) => options.onRemove?.(id),
      onResolve: (comment) => options.onResolve?.(comment),
      onReopen: (comment) => options.onReopen?.(comment),
      onError: (error) => options.onError?.(error),
    },
    handleStateChange
  );

  // Single load path: `immediate: true` covers the initial mount AND every
  // subsequent editor swap. The previous shape split this into `onMounted`
  // plus a non-immediate `watch`, which left the initial fire dependent on
  // the editor being non-null inside `onMounted` (a race with async editor
  // creation in `useVizelEditor`).
  watch(
    getEditor,
    (editor) => {
      if (editor && enabled) {
        void handlers.loadComments();
      }
    },
    { immediate: true }
  );

  return {
    comments: computed(() => state.comments),
    activeCommentId: computed(() => state.activeCommentId),
    isLoading: computed(() => state.isLoading),
    error: computed(() => state.error),
    addComment: (text, author?) => handlers.addComment(text, author),
    removeComment: (commentId) => handlers.removeComment(commentId),
    resolveComment: (commentId) => handlers.resolveComment(commentId),
    reopenComment: (commentId) => handlers.reopenComment(commentId),
    replyToComment: (commentId, text, author?) => handlers.replyToComment(commentId, text, author),
    setActiveComment: (commentId) => handlers.setActiveComment(commentId),
    loadComments: () => handlers.loadComments(),
    getCommentById: (commentId) => handlers.getCommentById(commentId),
  };
}
