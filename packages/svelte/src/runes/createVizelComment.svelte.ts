import {
  createVizelCommentHandlers,
  type Editor,
  VIZEL_DEFAULT_COMMENT_OPTIONS,
  type VizelComment,
  type VizelCommentOptions,
  type VizelCommentReply,
  type VizelCommentState,
} from "@vizel/core";

/**
 * Comment rune result
 */
export interface CreateVizelCommentResult {
  /** All stored comments (newest first) */
  readonly comments: VizelComment[];
  /** Currently active comment ID */
  readonly activeCommentId: string | null;
  /** Whether comments are loading */
  readonly isLoading: boolean;
  /** Last error that occurred */
  readonly error: Error | null;
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
 * Rune for managing document comments and annotations.
 *
 * @param getEditor - Function that returns the editor instance
 * @param options - Comment configuration options
 * @returns Comment state and controls
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { createVizelEditor, createVizelComment } from "@vizel/svelte";
 *
 * const editor = createVizelEditor({ features: { comment: true } });
 * const comment = createVizelComment(() => editor.current, { key: "my-comments" });
 * </script>
 *
 * <button onclick={() => comment.addComment("Needs review", "Author")}>
 *   Add Comment
 * </button>
 * {#each comment.comments as c}
 *   <div onclick={() => comment.setActiveComment(c.id)}>
 *     {c.text} {c.resolved ? "(resolved)" : ""}
 *   </div>
 * {/each}
 * ```
 */
export function createVizelComment(
  getEditor: () => Editor | null | undefined,
  options: VizelCommentOptions = {}
): CreateVizelCommentResult {
  const opts = { ...VIZEL_DEFAULT_COMMENT_OPTIONS, ...options };

  let comments = $state<VizelComment[]>([]);
  let activeCommentId = $state<string | null>(null);
  let isLoading = $state(false);
  let error = $state<Error | null>(null);

  const handleStateChange = (partial: Partial<VizelCommentState>) => {
    if (partial.comments !== undefined) comments = partial.comments;
    if (partial.activeCommentId !== undefined) activeCommentId = partial.activeCommentId;
    if (partial.isLoading !== undefined) isLoading = partial.isLoading;
    if (partial.error !== undefined) error = partial.error;
  };

  let handlers: ReturnType<typeof createVizelCommentHandlers> | null = null;

  $effect(() => {
    handlers = createVizelCommentHandlers(
      getEditor,
      {
        enabled: opts.enabled,
        storage: opts.storage,
        key: opts.key,
        onAdd: (comment) => options.onAdd?.(comment),
        onRemove: (id) => options.onRemove?.(id),
        onResolve: (comment) => options.onResolve?.(comment),
        onReopen: (comment) => options.onReopen?.(comment),
        onError: (err) => options.onError?.(err),
      },
      handleStateChange
    );

    const editor = getEditor();
    if (editor && opts.enabled) {
      handlers.loadComments();
    }

    return () => {
      handlers = null;
    };
  });

  return {
    get comments() {
      return comments;
    },
    get activeCommentId() {
      return activeCommentId;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    addComment: (text, author?) => handlers?.addComment(text, author) ?? Promise.resolve(null),
    removeComment: (commentId) => handlers?.removeComment(commentId) ?? Promise.resolve(),
    resolveComment: (commentId) => handlers?.resolveComment(commentId) ?? Promise.resolve(false),
    reopenComment: (commentId) => handlers?.reopenComment(commentId) ?? Promise.resolve(false),
    replyToComment: (commentId, text, author?) =>
      handlers?.replyToComment(commentId, text, author) ?? Promise.resolve(null),
    setActiveComment: (commentId) => handlers?.setActiveComment(commentId),
    loadComments: () => handlers?.loadComments() ?? Promise.resolve([]),
    getCommentById: (commentId) => handlers?.getCommentById(commentId),
  };
}
