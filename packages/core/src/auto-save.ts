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
  const state: { timeoutId: ReturnType<typeof setTimeout> | null } = { timeoutId: null };

  const cancel = (): void => {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
      state.timeoutId = null;
    }
  };

  const debounced = (...args: Parameters<T>) => {
    cancel();
    state.timeoutId = setTimeout(() => {
      fn(...args);
      state.timeoutId = null;
    }, ms);
  };

  debounced.cancel = cancel;

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

/**
 * Options for {@link createVizelRelativeTimeTicker}.
 */
export interface VizelRelativeTimeTickerOptions {
  /** Returns the reference date. `null`/`undefined` is rendered as an empty string. */
  getDate: () => Date | null | undefined;
  /** Returns the active locale (optional, called per tick). */
  getLocale?: () => VizelLocale | undefined;
  /** Tick interval in milliseconds (default: 10000). */
  intervalMs?: number;
  /** Called with the formatted string on every tick (and once synchronously). */
  onTick: (text: string) => void;
}

/**
 * Returned by {@link createVizelRelativeTimeTicker}.
 *
 * Follows the canonical controller contract: `mount()` starts the
 * interval and emits once synchronously; `unmount()` clears the
 * interval. Both are idempotent.
 */
export interface VizelRelativeTimeTicker {
  /** Start ticking. Emits once synchronously, then on every `intervalMs`. */
  readonly mount: () => void;
  /** Stop ticking. Safe to call repeatedly. */
  readonly unmount: () => void;
}

/**
 * Build a relative-time interval ticker.
 *
 * The factory itself has no side effects. `mount()` calls `onTick`
 * synchronously with the current relative-time string, then on every
 * `intervalMs` boundary until `unmount()` clears the interval.
 *
 * @example
 * ```tsx
 * // React adapter:
 * useEffect(() => {
 *   const ticker = createVizelRelativeTimeTicker({
 *     getDate: () => date,
 *     onTick: setText,
 *   });
 *   ticker.mount();
 *   return () => ticker.unmount();
 * }, []);
 * ```
 */
export function createVizelRelativeTimeTicker(
  options: VizelRelativeTimeTickerOptions
): VizelRelativeTimeTicker {
  const { getDate, getLocale, intervalMs = 10000, onTick } = options;

  const emit = (): void => {
    const date = getDate();
    onTick(date ? formatVizelRelativeTime(date, getLocale?.()) : "");
  };

  const state: { intervalId: ReturnType<typeof setInterval> | null } = { intervalId: null };

  return {
    mount: (): void => {
      if (state.intervalId !== null) return;
      emit();
      state.intervalId = setInterval(emit, intervalMs);
    },
    unmount: (): void => {
      if (state.intervalId === null) return;
      clearInterval(state.intervalId);
      state.intervalId = null;
    },
  };
}

/**
 * Resolved view-model for {@link VizelSaveIndicator}.
 *
 * Captures the status → display mapping so each framework only has to
 * render the icon and text once, instead of hand-writing a `switch`
 * inside both `<script>` and template.
 */
export interface VizelSaveIndicatorView {
  /** Name of the {@link VizelIcon} to render. */
  iconName: "check" | "loader" | "circle" | "warning";
  /** Whether the icon should be wrapped in the `vizel-save-indicator-spinner` element. */
  isSpinner: boolean;
  /** Localized status text. */
  text: string;
  /** Whether to render the relative timestamp span. */
  shouldShowTimestamp: boolean;
}

/**
 * Resolve the icon, text, and timestamp visibility for a {@link VizelSaveStatus}.
 *
 * Pure function consumed by framework `VizelSaveIndicator` components.
 *
 * @param status - Current save status.
 * @param locale - Optional locale providing translated status strings.
 * @param lastSaved - Last successful save timestamp (for visibility check).
 * @param relativeTime - Pre-computed relative-time string (empty when none).
 * @param showTimestamp - Whether the consumer requested timestamp display.
 */
export function resolveVizelSaveIndicatorView(
  status: VizelSaveStatus,
  locale: VizelLocale | undefined,
  lastSaved: Date | null | undefined,
  relativeTime: string,
  showTimestamp: boolean
): VizelSaveIndicatorView {
  const t = locale?.saveIndicator;
  switch (status) {
    case "saved":
      return {
        iconName: "check",
        isSpinner: false,
        text: t?.saved ?? "Saved",
        shouldShowTimestamp: Boolean(showTimestamp && lastSaved && relativeTime),
      };
    case "saving":
      return {
        iconName: "loader",
        isSpinner: true,
        text: t?.saving ?? "Saving...",
        shouldShowTimestamp: false,
      };
    case "unsaved":
      return {
        iconName: "circle",
        isSpinner: false,
        text: t?.unsaved ?? "Unsaved",
        shouldShowTimestamp: false,
      };
    case "error":
      return {
        iconName: "warning",
        isSpinner: false,
        text: t?.error ?? "Error saving",
        shouldShowTimestamp: false,
      };
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
