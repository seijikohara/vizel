import type { ReactNode } from "react";

export interface VizelToolbarButtonProps {
  /** Click handler. Optional when disabled is true. */
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: ReactNode;
  title?: string;
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
 *   <strong>B</strong>
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
      className={`vizel-bubble-menu-button ${isActive ? "is-active" : ""} ${className ?? ""}`}
      title={title}
      data-active={isActive || undefined}
      data-action={action}
    >
      {children}
    </button>
  );
}
