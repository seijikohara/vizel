import { formatRelativeTime, type SaveStatus } from "@vizel/core";
import { useEffect, useState } from "react";

export interface SaveIndicatorProps {
  /** Current save status */
  status: SaveStatus;
  /** Timestamp of last successful save */
  lastSaved?: Date | null;
  /** Show relative timestamp (default: true) */
  showTimestamp?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Visual indicator for the current save state of the editor.
 *
 * @example
 * ```tsx
 * <SaveIndicator
 *   status={status}
 *   lastSaved={lastSaved}
 *   showTimestamp
 * />
 * ```
 */
export function SaveIndicator({
  status,
  lastSaved,
  showTimestamp = true,
  className,
}: SaveIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  // Update relative time every 10 seconds
  useEffect(() => {
    if (!lastSaved) {
      setRelativeTime("");
      return;
    }

    const updateTime = () => {
      setRelativeTime(formatRelativeTime(lastSaved));
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  const getStatusIcon = () => {
    switch (status) {
      case "saved":
        return "✓";
      case "saving":
        return (
          <span className="vizel-save-indicator-spinner" aria-hidden="true">
            ⟳
          </span>
        );
      case "unsaved":
        return "•";
      case "error":
        return "⚠";
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "saved":
        return "Saved";
      case "saving":
        return "Saving...";
      case "unsaved":
        return "Unsaved";
      case "error":
        return "Error saving";
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
