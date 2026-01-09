export interface VizelBubbleMenuDividerProps {
  className?: string;
}

/**
 * A divider component for separating groups of buttons in the VizelBubbleMenu.
 *
 * @example
 * ```tsx
 * <VizelBubbleMenu>
 *   <VizelBubbleMenuButton>B</VizelBubbleMenuButton>
 *   <VizelBubbleMenuButton>I</VizelBubbleMenuButton>
 *   <VizelBubbleMenuDivider />
 *   <VizelBubbleMenuButton>Link</VizelBubbleMenuButton>
 * </VizelBubbleMenu>
 * ```
 */
export function VizelBubbleMenuDivider({ className }: VizelBubbleMenuDividerProps) {
  return <span className={`vizel-bubble-menu-divider ${className ?? ""}`} />;
}
