import type { ReactNode } from "react";

export interface BubbleMenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: ReactNode;
  title?: string;
  className?: string;
  /** Action identifier for testing */
  action?: string;
}

/**
 * A button component for use in the BubbleMenu toolbar.
 *
 * @example
 * ```tsx
 * <BubbleMenuButton
 *   onClick={() => editor.chain().focus().toggleBold().run()}
 *   isActive={editor.isActive("bold")}
 *   title="Bold (Cmd+B)"
 * >
 *   <strong>B</strong>
 * </BubbleMenuButton>
 * ```
 */
export function BubbleMenuButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
  className,
  action,
}: BubbleMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`vizel-bubble-menu-button ${isActive ? "is-active" : ""} ${className ?? ""}`}
      title={title}
      data-active={isActive || undefined}
      data-action={action}
    >
      {children}
    </button>
  );
}
