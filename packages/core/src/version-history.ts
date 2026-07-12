import type { Editor, JSONContent } from "@tiptap/core";

import {
  isVizelJsonContent,
  resolveVizelArrayStorageBackend,
  type VizelStorageBackend,
} from "./storage.ts";
import { generateVizelId } from "./utils/id.ts";

// =============================================================================
// Types
// =============================================================================

/**
 * A snapshot of the document at a point in time
 */
export interface VizelVersionSnapshot {
  /** Unique identifier */
  id: string;
  /** Document content as JSON */
  content: JSONContent;
  /** When the snapshot was created */
  timestamp: number;
  /** Optional description of changes */
  description?: string;
  /** Optional author name */
  author?: string;
}

/**
 * Storage backend for version history.
 *
 * Aliased to the shared {@link VizelStorageBackend} so all features (auto-save,
 * comments, version history) accept the same backend shape.
 */
export type VizelVersionStorage = VizelStorageBackend<VizelVersionSnapshot[]>;

/**
 * Configuration options for version history
 */
export interface VizelVersionHistoryOptions {
  /** Enable version history (default: true) */
  enabled?: boolean;
  /** Maximum number of versions to keep (default: 50) */
  maxVersions?: number;
  /** Storage backend (default: 'localStorage') */
  storage?: VizelVersionStorage;
  /** Storage key for localStorage (default: 'vizel-versions') */
  key?: string;
  /** Callback when a version is saved */
  onSave?: (snapshot: VizelVersionSnapshot) => void;
  /**
   * Callback when an error occurs. The error may be a `VizelError` — narrow
   * with `isVizelError(error)` to access the structured `code` field.
   */
  onError?: (error: Error) => void;
  /** Callback when a version is restored */
  onRestore?: (snapshot: VizelVersionSnapshot) => void;
}

/**
 * Version history state
 */
export interface VizelVersionHistoryState {
  /** All stored snapshots (newest first) */
  snapshots: VizelVersionSnapshot[];
  /** Whether the history is loading */
  isLoading: boolean;
  /** Last error that occurred */
  error: Error | null;
}

// =============================================================================
// Defaults
// =============================================================================

/**
 * Default version history options
 */
export const VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS = {
  enabled: true,
  maxVersions: 50,
  storage: "localStorage" as const,
  key: "vizel-versions",
} satisfies VizelVersionHistoryOptions;

// =============================================================================
// Storage
// =============================================================================

/**
 * Creates a normalized storage backend for version history
 */
const isVizelVersionSnapshot = (value: unknown): value is VizelVersionSnapshot => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.timestamp === "number" &&
    isVizelJsonContent(record.content)
  );
};

export function getVizelVersionStorageBackend(
  storage: VizelVersionStorage,
  key: string
): {
  save: (snapshots: VizelVersionSnapshot[]) => Promise<void>;
  load: () => Promise<VizelVersionSnapshot[]>;
} {
  return resolveVizelArrayStorageBackend<VizelVersionSnapshot>(
    storage,
    key,
    isVizelVersionSnapshot,
    "Failed to write version history to web storage"
  );
}

// =============================================================================
// Handlers
// =============================================================================

/**
 * Creates version history handlers for an editor.
 *
 * @example
 * ```typescript
 * const handlers = createVizelVersionHistoryHandlers(
 *   () => editor,
 *   { maxVersions: 20 },
 *   (state) => setState(prev => ({ ...prev, ...state }))
 * );
 *
 * // Save a version
 * await handlers.saveVersion("Initial draft");
 *
 * // List all versions
 * const versions = await handlers.loadVersions();
 *
 * // Restore a version
 * await handlers.restoreVersion(versions[0].id);
 * ```
 */
export function createVizelVersionHistoryHandlers(
  getEditor: () => Editor | null | undefined,
  options: VizelVersionHistoryOptions,
  onStateChange: (state: Partial<VizelVersionHistoryState>) => void
): {
  /** Save current document state as a new version */
  saveVersion: (description?: string, author?: string) => Promise<VizelVersionSnapshot | null>;
  /** Restore document to a specific version */
  restoreVersion: (versionId: string) => Promise<boolean>;
  /** Load all versions from storage */
  loadVersions: () => Promise<VizelVersionSnapshot[]>;
  /** Delete a specific version */
  deleteVersion: (versionId: string) => Promise<void>;
  /** Delete all versions */
  clearVersions: () => Promise<void>;
} {
  const opts = { ...VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS, ...options };
  const storageBackend = getVizelVersionStorageBackend(opts.storage, opts.key);

  const cache: { snapshots: VizelVersionSnapshot[] } = { snapshots: [] };

  const loadVersions = async (): Promise<VizelVersionSnapshot[]> => {
    try {
      onStateChange({ isLoading: true });
      const snapshots = await storageBackend.load();
      cache.snapshots = snapshots;
      onStateChange({ snapshots, isLoading: false, error: null });
      return snapshots;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ isLoading: false, error });
      opts.onError?.(error);
      return cache.snapshots;
    }
  };

  const saveVersion = async (
    description?: string,
    author?: string
  ): Promise<VizelVersionSnapshot | null> => {
    const editor = getEditor();
    if (!editor) return null;

    try {
      const snapshot: VizelVersionSnapshot = {
        id: generateVizelId(),
        content: editor.getJSON(),
        timestamp: Date.now(),
        ...(description !== undefined && { description }),
        ...(author !== undefined && { author }),
      };

      // Load current snapshots, prepend new one, enforce limit
      const existing = await storageBackend.load();
      const updated = [snapshot, ...existing].slice(0, opts.maxVersions);

      await storageBackend.save(updated);
      cache.snapshots = updated;
      onStateChange({ snapshots: updated, error: null });

      opts.onSave?.(snapshot);
      return snapshot;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ error });
      opts.onError?.(error);
      return null;
    }
  };

  const restoreVersion = async (versionId: string): Promise<boolean> => {
    const editor = getEditor();
    if (!editor) return false;

    try {
      const snapshots = cache.snapshots.length > 0 ? cache.snapshots : await storageBackend.load();
      const snapshot = snapshots.find((s) => s.id === versionId);
      if (!snapshot) return false;

      editor.commands.setContent(snapshot.content);
      opts.onRestore?.(snapshot);
      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ error });
      opts.onError?.(error);
      return false;
    }
  };

  const deleteVersion = async (versionId: string): Promise<void> => {
    try {
      const snapshots = cache.snapshots.length > 0 ? cache.snapshots : await storageBackend.load();
      const updated = snapshots.filter((s) => s.id !== versionId);
      await storageBackend.save(updated);
      cache.snapshots = updated;
      onStateChange({ snapshots: updated, error: null });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ error });
      opts.onError?.(error);
    }
  };

  const clearVersions = async (): Promise<void> => {
    try {
      await storageBackend.save([]);
      cache.snapshots = [];
      onStateChange({ snapshots: [], error: null });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ error });
      opts.onError?.(error);
    }
  };

  return {
    saveVersion,
    restoreVersion,
    loadVersions,
    deleteVersion,
    clearVersions,
  };
}
