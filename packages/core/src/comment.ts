import type { Editor } from "@tiptap/core";

// =============================================================================
// Types
// =============================================================================

/**
 * A reply to a comment
 */
export interface VizelCommentReply {
  /** Unique identifier */
  id: string;
  /** Reply text */
  text: string;
  /** Optional author name */
  author?: string;
  /** Unix timestamp (milliseconds) */
  createdAt: number;
}

/**
 * A comment annotation on the document
 */
export interface VizelComment {
  /** Unique identifier */
  id: string;
  /** Comment text */
  text: string;
  /** Optional author name */
  author?: string;
  /** Unix timestamp (milliseconds) */
  createdAt: number;
  /** Whether the comment is resolved */
  resolved: boolean;
  /** Replies to this comment */
  replies: VizelCommentReply[];
}

/**
 * Storage backend for comments.
 * Use `"localStorage"` for built-in browser storage, or provide a custom backend.
 */
export type VizelCommentStorage =
  | "localStorage"
  | {
      save: (comments: VizelComment[]) => void | Promise<void>;
      load: () => VizelComment[] | null | Promise<VizelComment[] | null>;
    };

/**
 * Configuration options for comment management
 */
export interface VizelCommentOptions {
  /** Enable comments (default: true) */
  enabled?: boolean;
  /** Storage backend (default: 'localStorage') */
  storage?: VizelCommentStorage;
  /** Storage key for localStorage (default: 'vizel-comments') */
  key?: string;
  /** Callback when a comment is added */
  onAdd?: (comment: VizelComment) => void;
  /** Callback when a comment is removed */
  onRemove?: (commentId: string) => void;
  /** Callback when a comment is resolved */
  onResolve?: (comment: VizelComment) => void;
  /** Callback when a comment is reopened */
  onReopen?: (comment: VizelComment) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Comment state
 */
export interface VizelCommentState {
  /** All stored comments (newest first) */
  comments: VizelComment[];
  /** Currently active comment ID */
  activeCommentId: string | null;
  /** Whether comments are loading */
  isLoading: boolean;
  /** Last error that occurred */
  error: Error | null;
}

// =============================================================================
// Defaults
// =============================================================================

/**
 * Default comment options
 */
export const VIZEL_DEFAULT_COMMENT_OPTIONS = {
  enabled: true,
  storage: "localStorage" as const,
  key: "vizel-comments",
} satisfies VizelCommentOptions;

// =============================================================================
// Storage
// =============================================================================

/**
 * Creates a normalized storage backend for comments
 */
export function getVizelCommentStorageBackend(
  storage: VizelCommentStorage,
  key: string
): {
  save: (comments: VizelComment[]) => Promise<void>;
  load: () => Promise<VizelComment[]>;
} {
  if (storage === "localStorage") {
    return {
      save: (comments: VizelComment[]) => {
        if (typeof localStorage === "undefined") return Promise.resolve();
        localStorage.setItem(key, JSON.stringify(comments));
        return Promise.resolve();
      },
      load: () => {
        if (typeof localStorage === "undefined") return Promise.resolve([]);
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              return Promise.resolve(parsed as VizelComment[]);
            }
          } catch {
            // Invalid data, return empty
          }
        }
        return Promise.resolve([]);
      },
    };
  }

  return {
    save: async (comments: VizelComment[]) => {
      await storage.save(comments);
    },
    load: async () => {
      return (await storage.load()) ?? [];
    },
  };
}

// =============================================================================
// Handlers
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates comment handlers for an editor.
 *
 * @example
 * ```typescript
 * const handlers = createVizelCommentHandlers(
 *   () => editor,
 *   { key: "my-comments" },
 *   (state) => setState(prev => ({ ...prev, ...state }))
 * );
 *
 * // Add a comment to the current selection
 * await handlers.addComment("Needs clarification", "Alice");
 *
 * // Resolve a comment
 * await handlers.resolveComment(commentId);
 *
 * // Reply to a comment
 * await handlers.replyToComment(commentId, "Fixed in latest commit", "Bob");
 * ```
 */
export function createVizelCommentHandlers(
  getEditor: () => Editor | null | undefined,
  options: VizelCommentOptions,
  onStateChange: (state: Partial<VizelCommentState>) => void
): {
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
} {
  const opts = { ...VIZEL_DEFAULT_COMMENT_OPTIONS, ...options };
  const storageBackend = getVizelCommentStorageBackend(opts.storage, opts.key);

  let cachedComments: VizelComment[] = [];

  const loadComments = async (): Promise<VizelComment[]> => {
    try {
      onStateChange({ isLoading: true });
      const comments = await storageBackend.load();
      cachedComments = comments;
      onStateChange({ comments, isLoading: false, error: null });
      return comments;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ isLoading: false, error });
      opts.onError?.(error);
      return cachedComments;
    }
  };

  const addComment = async (text: string, author?: string): Promise<VizelComment | null> => {
    const editor = getEditor();
    if (!editor) return null;

    const { from, to } = editor.state.selection;
    if (from === to) return null;

    try {
      const comment: VizelComment = {
        id: generateId(),
        text,
        createdAt: Date.now(),
        resolved: false,
        replies: [],
        ...(author !== undefined && { author }),
      };

      editor.commands.addCommentMark(comment.id);

      const updated = [comment, ...cachedComments];
      await storageBackend.save(updated);
      cachedComments = updated;
      onStateChange({ comments: updated, activeCommentId: comment.id, error: null });

      opts.onAdd?.(comment);
      return comment;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ error });
      opts.onError?.(error);
      return null;
    }
  };

  const removeComment = async (commentId: string): Promise<void> => {
    const editor = getEditor();

    try {
      if (editor) {
        editor.commands.removeCommentMark(commentId);
      }

      const updated = cachedComments.filter((c) => c.id !== commentId);
      await storageBackend.save(updated);
      cachedComments = updated;
      onStateChange({ comments: updated, activeCommentId: null, error: null });

      opts.onRemove?.(commentId);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ error });
      opts.onError?.(error);
    }
  };

  const resolveComment = async (commentId: string): Promise<boolean> => {
    try {
      const comment = cachedComments.find((c) => c.id === commentId);
      if (!comment) return false;

      const updatedComment = { ...comment, resolved: true };
      const updated = cachedComments.map((c) => (c.id === commentId ? updatedComment : c));
      await storageBackend.save(updated);
      cachedComments = updated;
      onStateChange({ comments: updated, error: null });

      opts.onResolve?.(updatedComment);
      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ error });
      opts.onError?.(error);
      return false;
    }
  };

  const reopenComment = async (commentId: string): Promise<boolean> => {
    try {
      const comment = cachedComments.find((c) => c.id === commentId);
      if (!comment) return false;

      const updatedComment = { ...comment, resolved: false };
      const updated = cachedComments.map((c) => (c.id === commentId ? updatedComment : c));
      await storageBackend.save(updated);
      cachedComments = updated;
      onStateChange({ comments: updated, error: null });

      opts.onReopen?.(updatedComment);
      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ error });
      opts.onError?.(error);
      return false;
    }
  };

  const replyToComment = async (
    commentId: string,
    text: string,
    author?: string
  ): Promise<VizelCommentReply | null> => {
    try {
      const comment = cachedComments.find((c) => c.id === commentId);
      if (!comment) return null;

      const reply: VizelCommentReply = {
        id: generateId(),
        text,
        createdAt: Date.now(),
        ...(author !== undefined && { author }),
      };

      const updatedComment = { ...comment, replies: [...comment.replies, reply] };
      const updated = cachedComments.map((c) => (c.id === commentId ? updatedComment : c));
      await storageBackend.save(updated);
      cachedComments = updated;
      onStateChange({ comments: updated, error: null });

      return reply;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ error });
      opts.onError?.(error);
      return null;
    }
  };

  const setActiveComment = (commentId: string | null): void => {
    const editor = getEditor();
    if (editor) {
      editor.commands.setActiveComment(commentId);
    }
    onStateChange({ activeCommentId: commentId });
  };

  const getCommentById = (commentId: string): VizelComment | undefined => {
    return cachedComments.find((c) => c.id === commentId);
  };

  return {
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
