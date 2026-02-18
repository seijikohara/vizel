import type { Editor, VizelToolbarActionItem } from "@vizel/core";
import { formatVizelTooltip, isVizelToolbarDropdownAction } from "@vizel/core";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { VizelIcon } from "./VizelIcon.tsx";
import { VizelToolbarButton } from "./VizelToolbarButton.tsx";
import { VizelToolbarDropdown } from "./VizelToolbarDropdown.tsx";

export interface VizelToolbarOverflowProps {
  editor: Editor;
  actions: VizelToolbarActionItem[];
  className?: string;
}

/**
 * An overflow menu that displays hidden toolbar actions in a popover.
 */
export function VizelToolbarOverflow({
  editor,
  actions,
  className,
}: VizelToolbarOverflowProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close]);

  if (actions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`vizel-toolbar-overflow ${className ?? ""}`}
      data-vizel-toolbar-overflow=""
    >
      <button
        type="button"
        className="vizel-toolbar-overflow-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="More actions"
      >
        <VizelIcon name="ellipsis" />
      </button>

      {isOpen && (
        <div className="vizel-toolbar-overflow-popover" role="menu">
          {actions.map((action) =>
            isVizelToolbarDropdownAction(action) ? (
              <VizelToolbarDropdown key={action.id} editor={editor} dropdown={action} />
            ) : (
              <VizelToolbarButton
                key={action.id}
                action={action.id}
                onClick={() => {
                  action.run(editor);
                  close();
                }}
                isActive={action.isActive(editor)}
                disabled={!action.isEnabled(editor)}
                title={formatVizelTooltip(action.label, action.shortcut)}
              >
                <VizelIcon name={action.icon} />
              </VizelToolbarButton>
            )
          )}
        </div>
      )}
    </div>
  );
}
