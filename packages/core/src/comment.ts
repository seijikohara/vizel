import type { Editor } from "@tiptap/core";
import { resolveVizelArrayStorageBackend, type VizelStorageBackend } from "./storage.ts";

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
 *
 * Aliased to the shared {@link VizelStorageBackend} so all features (auto-save,
 * comments, version history) accept the same backend shape.
 */
export type VizelCommentStorage = VizelStorageBackend<VizelComment[]>;

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
  /**
   * Callback when an error occurs. The error may be a `VizelError` — narrow
   * with `isVizelError(error)` to access the structured `code` field.
   */
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
const isVizelComment = (value: unknown): value is VizelComment => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.text === "string" &&
    typeof record.createdAt === "number" &&
    typeof record.resolved === "boolean" &&
    Array.isArray(record.replies)
  );
};

export function getVizelCommentStorageBackend(
  storage: VizelCommentStorage,
  key: string
): {
  save: (comments: VizelComment[]) => Promise<void>;
  load: () => Promise<VizelComment[]>;
} {
  return resolveVizelArrayStorageBackend<VizelComment>(
    storage,
    key,
    isVizelComment,
    "Failed to write comments to web storage"
  );
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

  const cache: { comments: VizelComment[] } = { comments: [] };

  const loadComments = async (): Promise<VizelComment[]> => {
    try {
      onStateChange({ isLoading: true });
      const comments = await storageBackend.load();
      cache.comments = comments;
      onStateChange({ comments, isLoading: false, error: null });
      return comments;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ isLoading: false, error });
      opts.onError?.(error);
      return cache.comments;
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

      const updated = [comment, ...cache.comments];
      await storageBackend.save(updated);
      cache.comments = updated;
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

      const updated = cache.comments.filter((c) => c.id !== commentId);
      await storageBackend.save(updated);
      cache.comments = updated;
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
      const comment = cache.comments.find((c) => c.id === commentId);
      if (!comment) return false;

      const updatedComment = { ...comment, resolved: true };
      const updated = cache.comments.map((c) => (c.id === commentId ? updatedComment : c));
      await storageBackend.save(updated);
      cache.comments = updated;
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
      const comment = cache.comments.find((c) => c.id === commentId);
      if (!comment) return false;

      const updatedComment = { ...comment, resolved: false };
      const updated = cache.comments.map((c) => (c.id === commentId ? updatedComment : c));
      await storageBackend.save(updated);
      cache.comments = updated;
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
      const comment = cache.comments.find((c) => c.id === commentId);
      if (!comment) return null;

      const reply: VizelCommentReply = {
        id: generateId(),
        text,
        createdAt: Date.now(),
        ...(author !== undefined && { author }),
      };

      const updatedComment = { ...comment, replies: [...comment.replies, reply] };
      const updated = cache.comments.map((c) => (c.id === commentId ? updatedComment : c));
      await storageBackend.save(updated);
      cache.comments = updated;
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
    return cache.comments.find((c) => c.id === commentId);
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
