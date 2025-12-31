import { SaveIndicator, type SaveStatus } from "@vizel/react";

interface SaveIndicatorFixtureProps {
  status: SaveStatus;
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
    <SaveIndicator
      status={status}
      lastSaved={lastSaved}
      showTimestamp={showTimestamp}
      className={className}
    />
  );
}
