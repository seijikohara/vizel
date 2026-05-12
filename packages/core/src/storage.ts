import type { JSONContent } from "@tiptap/core";

/**
 * Identifier for built-in browser web-storage backends.
 *
 * Both options are SSR-safe at runtime: when `window` is unavailable, the
 * resolved backend resolves with no-op writes and `null` reads.
 */
export type VizelWebStorageKind = "localStorage" | "sessionStorage";

/**
 * Custom storage backend.
 *
 * `save` and `load` may be sync or async. Both are required so consumers
 * cannot accidentally ship a write-only backend that silently drops every
 * read.
 */
export interface VizelCustomStorageBackend<T> {
  save: (value: T) => void | Promise<void>;
  load: () => T | null | Promise<T | null>;
}

/**
 * Storage backend abstraction shared by auto-save, comment, and
 * version-history features.
 *
 * Pass a string to use built-in browser storage, or pass an object literal
 * implementing `save`/`load` for custom storage (e.g. IndexedDB or a remote
 * API).
 */
export type VizelStorageBackend<T = JSONContent> =
  | VizelWebStorageKind
  | VizelCustomStorageBackend<T>;

/**
 * Type guard that validates a parsed value is a Tiptap `JSONContent`.
 *
 * Performs a structural check against the minimum invariants the editor
 * accepts. It does not deeply validate descendants, since Tiptap itself
 * tolerates partial documents.
 */
export const isVizelJsonContent = (value: unknown): value is JSONContent => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  // `type` must be a string node name; `content`, when present, must be an
  // array of further nodes. These two invariants are what Tiptap's
  // `setContent` walks before instantiating ProseMirror nodes, so checking
  // them here rejects garbage strings without false-positive-blocking
  // legitimate partial documents.
  if (typeof record.type !== "string") return false;
  if (record.content !== undefined && !Array.isArray(record.content)) return false;
  return true;
};
