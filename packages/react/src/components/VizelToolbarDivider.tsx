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
 *   <VizelToolbarDivider />
 *   <VizelToolbarButton>H1</VizelToolbarButton>
 * </VizelToolbar>
 * ```
 */
export function VizelToolbarDivider({ className }: VizelToolbarDividerProps) {
  return <span className={`vizel-toolbar-divider ${className ?? ""}`} />;
}
