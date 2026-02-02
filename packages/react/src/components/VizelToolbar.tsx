import type { Editor } from "@vizel/core";
import type { ReactNode } from "react";
import { useVizelContextSafe } from "./VizelContext.tsx";
import { VizelToolbarDefault } from "./VizelToolbarDefault.tsx";

export interface VizelToolbarProps {
  /** Editor instance. Falls back to context if not provided. */
  editor?: Editor | null;
  /** Additional CSS class name */
  className?: string;
  /** Whether to show the default toolbar (default: true). Set to false when using custom children. */
  showDefaultToolbar?: boolean;
  /** Custom toolbar content. When provided, replaces the default toolbar. */
  children?: ReactNode;
}

/**
 * Fixed toolbar component for the Vizel editor.
 * Displays formatting buttons above the editor content area.
 *
 * @example
 * ```tsx
 * // Default toolbar with all formatting buttons
 * <VizelToolbar editor={editor} />
 *
 * // Custom toolbar content
 * <VizelToolbar editor={editor}>
 *   <VizelToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}>
 *     <strong>B</strong>
 *   </VizelToolbarButton>
 * </VizelToolbar>
 * ```
 */
export function VizelToolbar({
  editor: editorProp,
  className,
  showDefaultToolbar = true,
  children,
}: VizelToolbarProps) {
  const context = useVizelContextSafe();
  const editor = editorProp ?? context?.editor ?? null;

  if (!editor) return null;

  return (
    <div className={`vizel-toolbar ${className ?? ""}`} role="toolbar" aria-label="Formatting">
      {children ?? (showDefaultToolbar && <VizelToolbarDefault editor={editor} />)}
    </div>
  );
}
