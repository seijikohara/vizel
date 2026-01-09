import type { ReactNode } from "react";

export interface VizelSlashMenuEmptyProps {
  children?: ReactNode;
  className?: string;
}

/**
 * An empty state component for the VizelSlashMenu when no results are found.
 *
 * @example
 * ```tsx
 * {items.length === 0 && (
 *   <VizelSlashMenuEmpty>No commands found</VizelSlashMenuEmpty>
 * )}
 * ```
 */
export function VizelSlashMenuEmpty({ children, className }: VizelSlashMenuEmptyProps) {
  return (
    <div className={`vizel-slash-menu-empty ${className ?? ""}`} data-vizel-slash-menu-empty="">
      {children ?? "No results"}
    </div>
  );
}
