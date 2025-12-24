export interface BubbleMenuDividerProps {
  className?: string;
}

/**
 * A divider component for separating groups of buttons in the BubbleMenu.
 *
 * @example
 * ```tsx
 * <BubbleMenu>
 *   <BubbleMenuButton>B</BubbleMenuButton>
 *   <BubbleMenuButton>I</BubbleMenuButton>
 *   <BubbleMenuDivider />
 *   <BubbleMenuButton>Link</BubbleMenuButton>
 * </BubbleMenu>
 * ```
 */
export function BubbleMenuDivider({ className }: BubbleMenuDividerProps) {
  return <span className={`vizel-bubble-menu-divider ${className ?? ""}`} />;
}
