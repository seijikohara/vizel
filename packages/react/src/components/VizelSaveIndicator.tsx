import {
  createVizelRelativeTimeTicker,
  resolveVizelSaveIndicatorView,
  type VizelLocale,
  type VizelSaveStatus,
} from "@vizel/core";
import { useEffect, useRef, useState } from "react";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelSaveIndicatorProps {
  /** Current save status */
  status: VizelSaveStatus;
  /** Timestamp of last successful save */
  lastSaved?: Date | null;
  /** Show relative timestamp (default: true) */
  showTimestamp?: boolean;
  /** Custom class name */
  className?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * Visual indicator for the current save state of the editor.
 *
 * The status → display mapping (icon, text, timestamp visibility) lives in
 * `@vizel/core`'s `resolveVizelSaveIndicatorView`. The relative-time interval
 * comes from `createVizelRelativeTimeTicker`. The component is just the
 * React-flavored binding.
 *
 * @example
 * ```tsx
 * <VizelSaveIndicator status={status} lastSaved={lastSaved} showTimestamp />
 * ```
 */
export function VizelSaveIndicator({
  status,
  lastSaved,
  showTimestamp = true,
  className,
  locale,
}: VizelSaveIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  // Keep the latest `lastSaved`/`locale` accessible from the ticker callback
  // without rebuilding the interval on every render.
  const lastSavedRef = useRef(lastSaved);
  lastSavedRef.current = lastSaved;
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useEffect(() => {
    const ticker = createVizelRelativeTimeTicker({
      getDate: () => lastSavedRef.current,
      getLocale: () => localeRef.current,
      onTick: setRelativeTime,
    });
    ticker.mount();
    return () => ticker.unmount();
  }, []);

  const view = resolveVizelSaveIndicatorView(
    status,
    locale,
    lastSaved,
    relativeTime,
    showTimestamp
  );

  return (
    <div
      className={`vizel-save-indicator vizel-save-indicator--${status} ${className ?? ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-vizel-save-indicator
    >
      <span className="vizel-save-indicator-icon" aria-hidden="true">
        {view.isSpinner ? (
          <span className="vizel-save-indicator-spinner" aria-hidden="true">
            <VizelIcon name={view.iconName} />
          </span>
        ) : (
          <VizelIcon name={view.iconName} />
        )}
      </span>
      <span className="vizel-save-indicator-text">{view.text}</span>
      {view.shouldShowTimestamp && (
        <span className="vizel-save-indicator-timestamp">{relativeTime}</span>
      )}
    </div>
  );
}
