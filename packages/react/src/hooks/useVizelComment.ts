import {
  createVizelCommentHandlers,
  type Editor,
  VIZEL_DEFAULT_COMMENT_OPTIONS,
  type VizelComment,
  type VizelCommentOptions,
  type VizelCommentReply,
  type VizelCommentState,
} from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Comment hook result
 */
export interface UseVizelCommentResult {
  /** All stored comments (newest first) */
  comments: VizelComment[];
  /** Currently active comment ID */
  activeCommentId: string | null;
  /** Whether comments are loading */
  isLoading: boolean;
  /** Last error that occurred */
  error: Error | null;
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
 * Hook for managing document comments and annotations.
 *
 * @param getEditor - Function that returns the editor instance
 * @param options - Comment configuration options
 * @returns Comment state and controls
 *
 * @example
 * ```tsx
 * function Editor() {
 *   const editor = useVizelEditor({
 *     features: { comment: true },
 *   });
 *   const { comments, addComment, resolveComment, setActiveComment } =
 *     useVizelComment(() => editor, { key: "my-comments" });
 *
 *   const handleAddComment = () => {
 *     const text = prompt("Enter comment:");
 *     if (text) addComment(text, "Author");
 *   };
 *
 *   return (
 *     <div>
 *       <VizelEditor editor={editor} />
 *       <button onClick={handleAddComment}>Add Comment</button>
 *       <ul>
 *         {comments.map((c) => (
 *           <li key={c.id} onClick={() => setActiveComment(c.id)}>
 *             {c.text} {c.resolved ? "(resolved)" : ""}
 *             <button onClick={() => resolveComment(c.id)}>Resolve</button>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVizelComment(
  getEditor: () => Editor | null | undefined,
  options: VizelCommentOptions = {}
): UseVizelCommentResult {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const enabled = options.enabled ?? VIZEL_DEFAULT_COMMENT_OPTIONS.enabled;
  const storage = options.storage ?? VIZEL_DEFAULT_COMMENT_OPTIONS.storage;
  const key = options.key ?? VIZEL_DEFAULT_COMMENT_OPTIONS.key;

  const [state, setState] = useState<VizelCommentState>({
    comments: [],
    activeCommentId: null,
    isLoading: false,
    error: null,
  });

  const getEditorRef = useRef(getEditor);
  getEditorRef.current = getEditor;

  const handleStateChange = useCallback((partial: Partial<VizelCommentState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const handlers = useMemo(
    () =>
      createVizelCommentHandlers(
        () => getEditorRef.current(),
        {
          enabled,
          storage,
          key,
          onAdd: (comment) => optionsRef.current.onAdd?.(comment),
          onRemove: (id) => optionsRef.current.onRemove?.(id),
          onResolve: (comment) => optionsRef.current.onResolve?.(comment),
          onReopen: (comment) => optionsRef.current.onReopen?.(comment),
          onError: (error) => optionsRef.current.onError?.(error),
        },
        handleStateChange
      ),
    [enabled, storage, key, handleStateChange]
  );

  // Track editor value (stable reference) instead of getEditor (unstable function)
  const editor = getEditor();
  useEffect(() => {
    if (editor && enabled) {
      handlers.loadComments();
    }
  }, [editor, enabled, handlers]);

  const addComment = useCallback(
    (text: string, author?: string) => handlers.addComment(text, author),
    [handlers]
  );

  const removeComment = useCallback(
    (commentId: string) => handlers.removeComment(commentId),
    [handlers]
  );

  const resolveComment = useCallback(
    (commentId: string) => handlers.resolveComment(commentId),
    [handlers]
  );

  const reopenComment = useCallback(
    (commentId: string) => handlers.reopenComment(commentId),
    [handlers]
  );

  const replyToComment = useCallback(
    (commentId: string, text: string, author?: string) =>
      handlers.replyToComment(commentId, text, author),
    [handlers]
  );

  const setActiveComment = useCallback(
    (commentId: string | null) => handlers.setActiveComment(commentId),
    [handlers]
  );

  const loadComments = useCallback(() => handlers.loadComments(), [handlers]);

  const getCommentById = useCallback(
    (commentId: string) => handlers.getCommentById(commentId),
    [handlers]
  );

  return {
    comments: state.comments,
    activeCommentId: state.activeCommentId,
    isLoading: state.isLoading,
    error: state.error,
    addComment,
    removeComment,
    resolveComment,
    reopenComment,
    replyToComment,
    setActiveComment,
    loadComments,
    getCommentById,
  };
}
