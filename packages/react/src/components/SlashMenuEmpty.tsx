import type { ReactNode } from "react";

export interface SlashMenuEmptyProps {
  children?: ReactNode;
  className?: string;
}

/**
 * An empty state component for the SlashMenu when no results are found.
 *
 * @example
 * ```tsx
 * {items.length === 0 && (
 *   <SlashMenuEmpty>No commands found</SlashMenuEmpty>
 * )}
 * ```
 */
export function SlashMenuEmpty({ children, className }: SlashMenuEmptyProps) {
  return (
    <div className={`vizel-slash-menu-empty ${className ?? ""}`}>
      {children ?? "No results"}
    </div>
  );
}
