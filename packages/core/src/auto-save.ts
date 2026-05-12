import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelLocale } from "./i18n/types.ts";
import { formatRelativeTimeWithLocale } from "./i18n/utils.ts";
import { isVizelJsonContent, type VizelStorageBackend } from "./storage.ts";

export type { VizelStorageBackend } from "./storage.ts";

/**
 * Auto-save configuration options
 */
export interface VizelAutoSaveOptions {
  /** Enable auto-save (default: true) */
  enabled?: boolean;
  /** Debounce delay in milliseconds (default: 1000) */
  debounceMs?: number;
  /** Storage backend (default: 'localStorage') */
  storage?: VizelStorageBackend;
  /** Storage key for localStorage/sessionStorage (default: 'vizel-content') */
  key?: string;
  /** Callback when content is saved */
  onSave?: (content: JSONContent) => void;
  /**
   * Callback when save or restore fails. The error may be a `VizelError` —
   * narrow with `isVizelError(error)` to access the structured `code` field.
   */
  onError?: (error: Error) => void;
  /** Callback when restore is attempted */
  onRestore?: (content: JSONContent | null) => void;
}

/**
 * Save status type
 */
export type VizelSaveStatus = "saved" | "saving" | "unsaved" | "error";

/**
 * Auto-save state
 */
export interface VizelAutoSaveState {
  /** Current save status */
  status: VizelSaveStatus;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Timestamp of last successful save */
  lastSaved: Date | null;
  /** Last error that occurred */
  error: Error | null;
}

/**
 * Default auto-save options
 */
export const VIZEL_DEFAULT_AUTO_SAVE_OPTIONS = {
  enabled: true,
  debounceMs: 1000,
  storage: "localStorage" as const,
  key: "vizel-content",
} satisfies VizelAutoSaveOptions;

/**
 * Creates a debounced function (internal utility)
 */
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number
): { (...args: Parameters<T>): void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, ms);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Gets the storage object based on backend type
 */
export function getVizelStorageBackend(
  storage: VizelStorageBackend,
  key: string
): {
  save: (content: JSONContent) => Promise<void>;
  load: () => Promise<JSONContent | null>;
} {
  if (storage === "localStorage" || storage === "sessionStorage") {
    return {
      save: (content: JSONContent) => {
        if (typeof window === "undefined") return Promise.resolve();
        try {
          const storageObject = storage === "localStorage" ? localStorage : sessionStorage;
          storageObject.setItem(key, JSON.stringify(content));
        } catch {
          // Storage quota exceeded or access denied; surface via the caller's catch.
          return Promise.reject(new Error("Failed to write to web storage"));
        }
        return Promise.resolve();
      },
      load: () => {
        if (typeof window === "undefined") return Promise.resolve(null);
        try {
          const storageObject = storage === "localStorage" ? localStorage : sessionStorage;
          const data = storageObject.getItem(key);
          if (!data) return Promise.resolve(null);
          const parsed: unknown = JSON.parse(data);
          if (!isVizelJsonContent(parsed)) return Promise.resolve(null);
          return Promise.resolve(parsed);
        } catch {
          return Promise.resolve(null);
        }
      },
    };
  }

  // Custom storage backend
  return {
    save: async (content: JSONContent) => {
      await storage.save(content);
    },
    load: async () => await storage.load(),
  };
}

/**
 * Creates auto-save handlers for an editor
 */
export function createVizelAutoSaveHandlers(
  getEditor: () => Editor | null | undefined,
  options: VizelAutoSaveOptions,
  onStateChange: (state: Partial<VizelAutoSaveState>) => void
): {
  /** Trigger a debounced save */
  save: () => void;
  /** Save immediately without debouncing */
  saveNow: () => Promise<void>;
  /** Restore content from storage */
  restore: () => Promise<JSONContent | null>;
  /** Handler for editor update events */
  handleUpdate: () => void;
  /** Cancel any pending debounced save */
  cancel: () => void;
} {
  const opts = { ...VIZEL_DEFAULT_AUTO_SAVE_OPTIONS, ...options };
  const storageBackend = getVizelStorageBackend(opts.storage, opts.key);

  const saveContent = async () => {
    const editor = getEditor();
    if (!editor) return;

    onStateChange({ status: "saving" });

    try {
      const content = editor.getJSON();
      await storageBackend.save(content);

      const now = new Date();
      onStateChange({
        status: "saved",
        hasUnsavedChanges: false,
        lastSaved: now,
        error: null,
      });

      opts.onSave?.(content);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({
        status: "error",
        error,
      });
      opts.onError?.(error);
    }
  };

  const debouncedSave = debounce(saveContent, opts.debounceMs);

  const handleUpdate = () => {
    if (!opts.enabled) return;

    onStateChange({
      status: "unsaved",
      hasUnsavedChanges: true,
    });

    debouncedSave();
  };

  const restore = async (): Promise<JSONContent | null> => {
    try {
      const content = await storageBackend.load();
      opts.onRestore?.(content);
      return content;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onStateChange({ status: "error", error });
      opts.onError?.(error);
      opts.onRestore?.(null);
      return null;
    }
  };

  return {
    save: debouncedSave,
    saveNow: saveContent,
    restore,
    handleUpdate,
    cancel: debouncedSave.cancel,
  };
}

/**
 * Format relative time for display.
 *
 * @param date - The date to format relative to now
 * @param locale - Optional locale for translated time strings
 */
export function formatVizelRelativeTime(date: Date, locale?: VizelLocale): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (locale) {
    const t = locale.relativeTime;
    if (diffSec < 5) return t.justNow;
    if (diffSec < 60) return formatRelativeTimeWithLocale(t.secondsAgo, diffSec);
    if (diffMin < 60) return formatRelativeTimeWithLocale(t.minutesAgo, diffMin);
    if (diffHour < 24) return formatRelativeTimeWithLocale(t.hoursAgo, diffHour);
    return formatRelativeTimeWithLocale(t.daysAgo, diffDay);
  }

  if (diffSec < 5) {
    return "Just now";
  }
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }
  return `${diffDay}d ago`;
}
