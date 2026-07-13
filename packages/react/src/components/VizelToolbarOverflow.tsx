import type { Editor, VizelLocale, VizelToolbarActionItem } from "@vizel/core";
import { formatVizelTooltip, isVizelToolbarDropdownAction, vizelEnLocale } from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { VizelIcon } from "./VizelIcon.tsx";
import { VizelToolbarButton } from "./VizelToolbarButton.tsx";
import { VizelToolbarDropdown } from "./VizelToolbarDropdown.tsx";

export interface VizelToolbarOverflowProps {
  editor: Editor;
  actions: readonly VizelToolbarActionItem[];
  className?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * An overflow menu that displays hidden toolbar actions in a popover.
 *
 * Pointer-outside and Escape dismissal route through
 * `createVizelDismissable` from `@vizel/headless`, so the component never
 * attaches document listeners directly.
 */
export function VizelToolbarOverflow({
  editor,
  actions,
  className,
  locale,
}: VizelToolbarOverflowProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Hold the latest `close` callback in a ref so the controller calls the
  // current handler without re-mounting its listeners.
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    // `captureEscape: true` runs the Escape handler in the capture phase
    // and calls `stopImmediatePropagation()`. The overflow popover owns
    // Escape while open; otherwise the editor's bubble-phase keymap also
    // fires and resets the selection or drops focus from the trigger.
    // The controller owns this adapter-side contract.
    const controller = createVizelDismissable({
      onPointerOutside: () => closeRef.current(),
      onEscape: () => closeRef.current(),
      captureEscape: true,
    });
    controller.mount(container);
    return () => controller.unmount();
  }, [isOpen]);

  if (actions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`vizel-toolbar-overflow ${className ?? ""}`}
      data-vizel-toolbar-overflow=""
    >
      <button
        ref={triggerRef}
        type="button"
        className="vizel-toolbar-overflow-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={locale?.toolbar.moreActions ?? vizelEnLocale.toolbar.moreActions}
      >
        <VizelIcon name="ellipsis" />
      </button>

      {isOpen && (
        <div className="vizel-toolbar-overflow-popover" role="group">
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
