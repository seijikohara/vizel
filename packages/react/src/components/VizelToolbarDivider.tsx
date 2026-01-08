export interface VizelToolbarDividerProps {
  className?: string;
}

/**
 * A divider component for separating groups of buttons in the VizelToolbar.
 *
 * @example
 * ```tsx
 * <VizelToolbar>
 *   <VizelToolbarButton>B</VizelToolbarButton>
 *   <VizelToolbarButton>I</VizelToolbarButton>
 *   <VizelToolbarDivider />
 *   <VizelToolbarButton>Link</VizelToolbarButton>
 * </VizelToolbar>
 * ```
 */
export function VizelToolbarDivider({ className }: VizelToolbarDividerProps) {
  return <span className={`vizel-bubble-menu-divider ${className ?? ""}`} />;
}
