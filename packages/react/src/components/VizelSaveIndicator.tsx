import { formatVizelRelativeTime, type VizelLocale, type VizelSaveStatus } from "@vizel/core";
import { useEffect, useState } from "react";
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
 * @example
 * ```tsx
 * <VizelSaveIndicator
 *   status={status}
 *   lastSaved={lastSaved}
 *   showTimestamp
 * />
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

  // Update relative time every 10 seconds
  useEffect(() => {
    if (!lastSaved) {
      setRelativeTime("");
      return;
    }

    const updateTime = () => {
      setRelativeTime(formatVizelRelativeTime(lastSaved, locale));
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);

    return () => clearInterval(interval);
  }, [lastSaved, locale]);

  const getStatusIcon = () => {
    switch (status) {
      case "saved":
        return <VizelIcon name="check" />;
      case "saving":
        return (
          <span className="vizel-save-indicator-spinner" aria-hidden="true">
            <VizelIcon name="loader" />
          </span>
        );
      case "unsaved":
        return <VizelIcon name="circle" />;
      case "error":
        return <VizelIcon name="warning" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    const t = locale?.saveIndicator;
    switch (status) {
      case "saved":
        return t?.saved ?? "Saved";
      case "saving":
        return t?.saving ?? "Saving...";
      case "unsaved":
        return t?.unsaved ?? "Unsaved";
      case "error":
        return t?.error ?? "Error saving";
      default:
        return "";
    }
  };

  const shouldShowTimestamp = showTimestamp && lastSaved && relativeTime && status === "saved";

  return (
    // biome-ignore lint/a11y/useSemanticElements: role="status" is appropriate for non-form status announcements
    <div
      className={`vizel-save-indicator vizel-save-indicator--${status} ${className ?? ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-vizel-save-indicator
    >
      <span className="vizel-save-indicator-icon" aria-hidden="true">
        {getStatusIcon()}
      </span>
      <span className="vizel-save-indicator-text">{getStatusText()}</span>
      {shouldShowTimestamp && (
        <span className="vizel-save-indicator-timestamp">{relativeTime}</span>
      )}
    </div>
  );
}
