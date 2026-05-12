import type { VizelSaveStatus } from "@vizel/core";
import { VizelSaveIndicator } from "@vizel/react";

interface SaveIndicatorFixtureProps {
  status: VizelSaveStatus;
  lastSaved?: Date | null;
  showTimestamp?: boolean;
  className?: string;
}

export function SaveIndicatorFixture({
  status,
  lastSaved,
  showTimestamp,
  className,
}: SaveIndicatorFixtureProps) {
  return (
    <VizelSaveIndicator
      status={status}
      lastSaved={lastSaved}
      showTimestamp={showTimestamp}
      className={className}
    />
  );
}
