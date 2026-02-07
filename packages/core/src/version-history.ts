import type { Editor, JSONContent } from "@tiptap/core";

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
 * Use `"localStorage"` for built-in browser storage, or provide a custom backend.
 */
export type VizelVersionStorage =
  | "localStorage"
  | {
      save: (snapshots: VizelVersionSnapshot[]) => void | Promise<void>;
      load: () => VizelVersionSnapshot[] | null | Promise<VizelVersionSnapshot[] | null>;
    };

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
  /** Callback when an error occurs */
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
export function getVizelVersionStorageBackend(
  storage: VizelVersionStorage,
  key: string
): {
  save: (snapshots: VizelVersionSnapshot[]) => Promise<void>;
  load: () => Promise<VizelVersionSnapshot[]>;
} {
  if (storage === "localStorage") {
    return {
      save: (snapshots: VizelVersionSnapshot[]) => {
        if (typeof localStorage === "undefined") return Promise.resolve();
        localStorage.setItem(key, JSON.stringify(snapshots));
        return Promise.resolve();
      },
      load: () => {
        if (typeof localStorage === "undefined") return Promise.resolve([]);
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              return Promise.resolve(parsed as VizelVersionSnapshot[]);
            }
          } catch {
            // Invalid data, return empty
          }
        }
        return Promise.resolve([]);
      },
    };
  }

  // Custom storage backend
  return {
    save: async (snapshots: VizelVersionSnapshot[]) => {
      await storage.save(snapshots);
    },
    load: async () => {
      const result = await storage.load();
      return result ?? [];
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

  let cachedSnapshots: VizelVersionSnapshot[] = [];

  const loadVersions = async (): Promise<VizelVersionSnapshot[]> => {
    try {
      onStateChange({ isLoading: true });
      const snapshots = await storageBackend.load();
      cachedSnapshots = snapshots;
      onStateChange({ snapshots, isLoading: false, error: null });
      return snapshots;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ isLoading: false, error });
      opts.onError?.(error);
      return cachedSnapshots;
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
        id: generateId(),
        content: editor.getJSON(),
        timestamp: Date.now(),
        ...(description !== undefined && { description }),
        ...(author !== undefined && { author }),
      };

      // Load current snapshots, prepend new one, enforce limit
      const existing = await storageBackend.load();
      const updated = [snapshot, ...existing].slice(0, opts.maxVersions);

      await storageBackend.save(updated);
      cachedSnapshots = updated;
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
      const snapshots = cachedSnapshots.length > 0 ? cachedSnapshots : await storageBackend.load();
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
      const snapshots = cachedSnapshots.length > 0 ? cachedSnapshots : await storageBackend.load();
      const updated = snapshots.filter((s) => s.id !== versionId);
      await storageBackend.save(updated);
      cachedSnapshots = updated;
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
      cachedSnapshots = [];
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
