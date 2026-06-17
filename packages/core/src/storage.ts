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

// =============================================================================
// Web-storage backend resolution
// =============================================================================
//
// `auto-save`, `comment`, and `version-history` each persist through the same
// `VizelStorageBackend` union. The browser-storage branch is identical across
// the three features — an SSR guard, a try/catch around `setItem`/`getItem`,
// and a JSON round-trip — so the logic lives here once. The two resolvers
// below differ only in how each treats an absent value: a single document
// coalesces to `null`, an array coalesces to `[]`.

/** Resolve the browser storage object for a kind, or `null` at SSR time. */
const resolveWebStorage = (kind: VizelWebStorageKind): Storage | null => {
  if (typeof window === "undefined") return null;
  return kind === "localStorage" ? localStorage : sessionStorage;
};

/**
 * Write a serialized value to web storage.
 *
 * No-op at SSR time. Reject with `writeErrorMessage` when the browser
 * throws (quota exceeded or access denied) so the caller's catch surfaces
 * the failure.
 */
const saveToWebStorage = (
  kind: VizelWebStorageKind,
  key: string,
  serialized: string,
  writeErrorMessage: string
): Promise<void> => {
  const webStorage = resolveWebStorage(kind);
  if (!webStorage) return Promise.resolve();
  try {
    webStorage.setItem(key, serialized);
  } catch {
    return Promise.reject(new Error(writeErrorMessage));
  }
  return Promise.resolve();
};

/**
 * Read and JSON-parse a value from web storage.
 *
 * Return `undefined` when storage is unavailable (SSR), the key holds no
 * data, or parsing throws, so each caller maps every miss to its own empty
 * value.
 */
const readFromWebStorage = (kind: VizelWebStorageKind, key: string): unknown => {
  const webStorage = resolveWebStorage(kind);
  if (!webStorage) return undefined;
  try {
    const data = webStorage.getItem(key);
    if (!data) return undefined;
    return JSON.parse(data) as unknown;
  } catch {
    return undefined;
  }
};

/** Normalized async backend for a single nullable value. */
export interface VizelValueStorageBackend<T> {
  save: (value: T) => Promise<void>;
  load: () => Promise<T | null>;
}

/**
 * Resolve a {@link VizelStorageBackend} that persists a single nullable
 * value, such as the auto-saved document.
 *
 * The web-storage branch returns `null` when storage is unavailable,
 * empty, or fails `deserialize`. A custom backend passes through its own
 * `save` and `load`.
 *
 * @param storage - Built-in kind or custom backend.
 * @param key - Storage key for the web-storage branch.
 * @param deserialize - Map a parsed JSON value to `T`, or `null` to reject it.
 * @param writeErrorMessage - Message for a rejected web-storage write.
 */
export function resolveVizelValueStorageBackend<T>(
  storage: VizelStorageBackend<T>,
  key: string,
  deserialize: (parsed: unknown) => T | null,
  writeErrorMessage: string
): VizelValueStorageBackend<T> {
  if (storage === "localStorage" || storage === "sessionStorage") {
    return {
      save: (value: T) => saveToWebStorage(storage, key, JSON.stringify(value), writeErrorMessage),
      load: () => {
        const parsed = readFromWebStorage(storage, key);
        return Promise.resolve(parsed === undefined ? null : deserialize(parsed));
      },
    };
  }
  return {
    save: async (value: T) => {
      await storage.save(value);
    },
    load: async () => await storage.load(),
  };
}

/** Normalized async backend for an array of records. */
export interface VizelArrayStorageBackend<T> {
  save: (items: T[]) => Promise<void>;
  load: () => Promise<T[]>;
}

/**
 * Resolve a {@link VizelStorageBackend} that persists an array of records,
 * such as comment threads or version snapshots.
 *
 * The web-storage branch returns `[]` when storage is unavailable, empty,
 * or unparseable, and filters parsed entries through `isItem` so malformed
 * elements never reach the editor. A custom backend passes through `save`
 * and coalesces a `null` `load` to `[]`.
 *
 * @param storage - Built-in kind or custom backend.
 * @param key - Storage key for the web-storage branch.
 * @param isItem - Type guard that validates one parsed array element.
 * @param writeErrorMessage - Message for a rejected web-storage write.
 */
export function resolveVizelArrayStorageBackend<T>(
  storage: VizelStorageBackend<T[]>,
  key: string,
  isItem: (value: unknown) => value is T,
  writeErrorMessage: string
): VizelArrayStorageBackend<T> {
  if (storage === "localStorage" || storage === "sessionStorage") {
    return {
      save: (items: T[]) =>
        saveToWebStorage(storage, key, JSON.stringify(items), writeErrorMessage),
      load: () => {
        const parsed = readFromWebStorage(storage, key);
        return Promise.resolve(Array.isArray(parsed) ? parsed.filter(isItem) : []);
      },
    };
  }
  return {
    save: async (items: T[]) => {
      await storage.save(items);
    },
    load: async () => (await storage.load()) ?? [],
  };
}
