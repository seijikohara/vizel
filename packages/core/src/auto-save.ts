import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelLocale } from "./i18n/types.ts";
import { formatRelativeTimeWithLocale } from "./i18n/utils.ts";
import {
  isVizelJsonContent,
  resolveVizelValueStorageBackend,
  type VizelStorageBackend,
} from "./storage.ts";

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
 * Resolve the auto-save storage backend for a document.
 *
 * Delegates to {@link resolveVizelValueStorageBackend}; a parsed value that
 * fails {@link isVizelJsonContent} resolves to `null`.
 */
export function getVizelStorageBackend(
  storage: VizelStorageBackend,
  key: string
): {
  save: (content: JSONContent) => Promise<void>;
  load: () => Promise<JSONContent | null>;
} {
  return resolveVizelValueStorageBackend<JSONContent>(
    storage,
    key,
    (parsed) => (isVizelJsonContent(parsed) ? parsed : null),
    "Failed to write to web storage"
  );
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
 * Resolved view-model for the framework `VizelSaveIndicator` components.
 *
 * Captures the status → display mapping so each framework only has to
 * render the icon and text once, instead of hand-writing a `switch`
 * inside both `<script>` and template.
 */
export interface VizelSaveIndicatorView {
  /** Name of the icon to render. */
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
