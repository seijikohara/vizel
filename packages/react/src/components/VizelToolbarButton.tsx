import type { ReactNode } from "react";

export interface VizelToolbarButtonProps {
  /** Click handler */
  onClick?: () => void;
  /** Whether the action is currently active */
  isActive?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button content (typically an icon) */
  children: ReactNode;
  /** Tooltip text */
  title?: string;
  /** Additional CSS class name */
  className?: string;
  /** Action identifier for testing */
  action?: string;
}

/**
 * A button component for use in the VizelToolbar.
 *
 * @example
 * ```tsx
 * <VizelToolbarButton
 *   onClick={() => editor.chain().focus().toggleBold().run()}
 *   isActive={editor.isActive("bold")}
 *   title="Bold (Cmd+B)"
 * >
 *   <VizelIcon name="bold" />
 * </VizelToolbarButton>
 * ```
 */
export function VizelToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
  className,
  action,
}: VizelToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      className={`vizel-toolbar-button ${isActive ? "is-active" : ""} ${className ?? ""}`}
      title={title}
      data-active={isActive || undefined}
      data-action={action}
    >
      {children}
    </button>
  );
}
