import {
  createVizelVersionHistoryHandlers,
  type Editor,
  VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS,
  type VizelVersionHistoryOptions,
  type VizelVersionHistoryState,
  type VizelVersionSnapshot,
} from "@vizel/core";

/**
 * Version history rune result
 */
export interface CreateVizelVersionHistoryResult {
  /** All stored snapshots (newest first) */
  readonly snapshots: VizelVersionSnapshot[];
  /** Whether history is loading */
  readonly isLoading: boolean;
  /** Last error that occurred */
  readonly error: Error | null;
  /** Save current document as a new version */
  saveVersion: (description?: string, author?: string) => Promise<VizelVersionSnapshot | null>;
  /** Restore document to a specific version */
  restoreVersion: (versionId: string) => Promise<boolean>;
  /** Load all versions from storage */
  loadVersions: () => Promise<VizelVersionSnapshot[]>;
  /** Delete a specific version */
  deleteVersion: (versionId: string) => Promise<void>;
  /** Delete all versions */
  clearVersions: () => Promise<void>;
}

/**
 * Svelte 5 rune for managing document version history.
 *
 * @param getEditor - Function that returns the editor instance
 * @param options - Version history configuration options
 * @returns Version history state and controls
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { createVizelEditor, createVizelVersionHistory } from '@vizel/svelte';
 *
 * const editor = createVizelEditor({ ... });
 * const history = createVizelVersionHistory(() => editor.current, {
 *   maxVersions: 20,
 * });
 * </script>
 *
 * <button onclick={() => history.saveVersion("Manual save")}>Save Version</button>
 * {#each history.snapshots as snapshot}
 *   <div>{snapshot.description} - {new Date(snapshot.timestamp).toLocaleString()}</div>
 * {/each}
 * ```
 */
export function createVizelVersionHistory(
  getEditor: () => Editor | null | undefined,
  options: VizelVersionHistoryOptions = {}
): CreateVizelVersionHistoryResult {
  const opts = { ...VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS, ...options };

  let snapshots = $state<VizelVersionSnapshot[]>([]);
  let isLoading = $state(false);
  let error = $state<Error | null>(null);

  let handlers: ReturnType<typeof createVizelVersionHistoryHandlers> | null = null;

  function handleStateChange(partial: Partial<VizelVersionHistoryState>) {
    if (partial.snapshots !== undefined) snapshots = partial.snapshots;
    if (partial.isLoading !== undefined) isLoading = partial.isLoading;
    if (partial.error !== undefined) error = partial.error;
  }

  $effect(() => {
    const editor = getEditor();
    handlers = createVizelVersionHistoryHandlers(getEditor, opts, handleStateChange);

    if (editor && opts.enabled) {
      handlers.loadVersions();
    }

    return () => {
      handlers = null;
    };
  });

  async function saveVersion(
    description?: string,
    author?: string
  ): Promise<VizelVersionSnapshot | null> {
    return (await handlers?.saveVersion(description, author)) ?? null;
  }

  async function restoreVersion(versionId: string): Promise<boolean> {
    return (await handlers?.restoreVersion(versionId)) ?? false;
  }

  async function loadVersions(): Promise<VizelVersionSnapshot[]> {
    return (await handlers?.loadVersions()) ?? [];
  }

  async function deleteVersion(versionId: string): Promise<void> {
    await handlers?.deleteVersion(versionId);
  }

  async function clearVersions(): Promise<void> {
    await handlers?.clearVersions();
  }

  return {
    get snapshots() {
      return snapshots;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    saveVersion,
    restoreVersion,
    loadVersions,
    deleteVersion,
    clearVersions,
  };
}
