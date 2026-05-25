import type { Editor } from "@vizel/core";
import {
  buildVizelBlockMenuSpec,
  clampMenuPosition,
  createVizelBlockMenuActions,
  createVizelNodeTypes,
  getVizelTurnIntoOptions,
  shouldFlipSubmenu,
  VIZEL_BLOCK_MENU_EVENT,
  type VizelBlockMenuAction,
  type VizelBlockMenuOpenDetail,
  type VizelLocale,
  type VizelNodeTypeOption,
  vizelDefaultBlockMenuActions,
  vizelDefaultNodeTypes,
  vizelRequestAnimationFrame,
} from "@vizel/core";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVizelContextSafe } from "./VizelContext.tsx";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelBlockMenuProps {
  /**
   * Bind this menu to a specific editor. Falls back to the editor from
   * `VizelProvider` context. When set (either way), the menu only reacts to
   * drag-handle events from the bound editor, so multiple editors on the
   * same page do not cross-trigger each other's menus.
   */
  editor?: Editor | null;
  /** Custom block menu actions (replaces defaults) */
  actions?: readonly VizelBlockMenuAction[];
  /** Custom node types for "Turn into" submenu */
  nodeTypes?: readonly VizelNodeTypeOption[];
  /** Additional class name */
  className?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

interface BlockMenuState extends VizelBlockMenuOpenDetail {
  x: number;
  y: number;
}

/**
 * Block context menu that appears when clicking the drag handle.
 * DOM/ARIA scaffolding (sections, submenu trigger, submenu list) comes
 * from `@vizel/core`'s `buildVizelBlockMenuSpec`; the React
 * component owns positioning, focus management, and runtime action
 * binding.
 */
export function VizelBlockMenu({
  editor: editorProp,
  actions,
  nodeTypes,
  className,
  locale,
}: VizelBlockMenuProps): ReactNode {
  const contextEditor = useVizelContextSafe();
  const boundEditor: Editor | null = editorProp ?? contextEditor;
  const effectiveActions = useMemo(
    () => actions ?? (locale ? createVizelBlockMenuActions(locale) : vizelDefaultBlockMenuActions),
    [actions, locale]
  );
  const effectiveNodeTypes = useMemo(
    () => nodeTypes ?? (locale ? createVizelNodeTypes(locale) : vizelDefaultNodeTypes),
    [nodeTypes, locale]
  );
  const [menuState, setMenuState] = useState<BlockMenuState | null>(null);
  const [showTurnInto, setShowTurnInto] = useState(false);
  const [submenuFlipped, setSubmenuFlipped] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const menuEditorRef = useRef<Editor | null>(null);

  const close = useCallback(() => {
    setMenuState(null);
    setShowTurnInto(false);
    menuEditorRef.current?.view.dom.focus();
    menuEditorRef.current = null;
  }, []);

  useEffect(() => {
    // `isMounted` guards the rAF callback against the React 19 strict-mode
    // setup → cleanup → setup sequence, where the rAF scheduled in the
    // first setup can fire after the first cleanup has detached the
    // listener — without the guard the callback would call setMenuState
    // against a stale closure.
    const lifecycle = { isMounted: true };
    const handler = (e: Event) => {
      if (!(e instanceof CustomEvent)) return;
      const detail = e.detail as VizelBlockMenuOpenDetail;
      if (boundEditor && detail.editor !== boundEditor) return;
      menuEditorRef.current = detail.editor;
      setMenuState({
        ...detail,
        x: detail.handleRect.left,
        y: detail.handleRect.bottom + 4,
      });
      setShowTurnInto(false);

      vizelRequestAnimationFrame(() => {
        if (!lifecycle.isMounted) return;
        const el = menuRef.current;
        if (!el) return;
        const clamped = clampMenuPosition(detail.handleRect, el.offsetWidth, el.offsetHeight);
        setMenuState((prev) => (prev ? { ...prev, x: clamped.x, y: clamped.y } : prev));
      });
    };

    document.addEventListener(VIZEL_BLOCK_MENU_EVENT, handler);
    return () => {
      lifecycle.isMounted = false;
      document.removeEventListener(VIZEL_BLOCK_MENU_EVENT, handler);
    };
  }, [boundEditor]);

  useEffect(() => {
    if (!(menuState && menuRef.current)) return;
    const firstItem = menuRef.current.querySelector<HTMLButtonElement>(
      '[role="menuitem"]:not([disabled])'
    );
    firstItem?.focus();
  }, [menuState]);

  useEffect(() => {
    if (!menuState) return;

    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !submenuRef.current?.contains(e.target)
      ) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuState, close]);

  useEffect(() => {
    if (!(showTurnInto && menuRef.current)) {
      setSubmenuFlipped(false);
      return;
    }
    vizelRequestAnimationFrame(() => {
      const parentRect = menuRef.current?.getBoundingClientRect();
      if (parentRect) {
        setSubmenuFlipped(shouldFlipSubmenu(parentRect, 200));
      }
    });
  }, [showTurnInto]);

  const turnIntoOptions = useMemo(
    () => (menuState ? getVizelTurnIntoOptions(menuState.editor, effectiveNodeTypes) : []),
    [menuState, effectiveNodeTypes]
  );

  const spec = useMemo(
    () => buildVizelBlockMenuSpec(effectiveActions, turnIntoOptions, showTurnInto, locale),
    [effectiveActions, turnIntoOptions, showTurnInto, locale]
  );

  if (!menuState) return null;

  const { editor, pos, node } = menuState;

  const handleAction = (action: VizelBlockMenuAction) => {
    action.run(editor, pos, node);
    close();
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (!menuRef.current) return;

    const items = Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
    );
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
        break;
      case "Home":
        e.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        items.at(-1)?.focus();
        break;
      default:
        break;
    }
  };

  const handleTurnInto = (nodeType: VizelNodeTypeOption) => {
    editor.chain().focus().setNodeSelection(pos).run();
    nodeType.command(editor);
    close();
  };

  return (
    <div
      ref={menuRef}
      className={`vizel-block-menu ${className ?? ""}`}
      style={{ left: menuState.x, top: menuState.y }}
      role="menu"
      aria-label={spec.root["aria-label"]}
      data-vizel-block-menu=""
      tabIndex={spec.root.tabIndex}
      onKeyDown={handleMenuKeyDown}
    >
      {spec.sections.map((section, sectionIndex) => (
        <div key={section.key}>
          {sectionIndex > 0 && <div className="vizel-block-menu-divider" />}
          {section.items.map((slot) => {
            const disabled = slot.data.action.isEnabled
              ? !slot.data.action.isEnabled(editor, node)
              : false;
            return (
              <button
                key={slot.key}
                type="button"
                className={`vizel-block-menu-item${slot.data.isDestructive ? " is-destructive" : ""}`}
                role={slot.attrs.role}
                onClick={() => handleAction(slot.data.action)}
                disabled={disabled}
              >
                <span className="vizel-block-menu-item-icon">
                  <VizelIcon name={slot.data.action.icon} />
                </span>
                <span className="vizel-block-menu-item-label">{slot.data.action.label}</span>
                {slot.data.action.shortcut && (
                  <span className="vizel-block-menu-item-shortcut">
                    {slot.data.action.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      <div className="vizel-block-menu-divider" />
      <button
        type="button"
        className="vizel-block-menu-item vizel-block-menu-submenu-trigger"
        role={spec.submenuTrigger.attrs.role}
        aria-haspopup={spec.submenuTrigger.attrs["aria-haspopup"]}
        aria-expanded={spec.submenuTrigger.attrs["aria-expanded"]}
        onMouseEnter={() => setShowTurnInto(true)}
        onClick={() => setShowTurnInto(!showTurnInto)}
      >
        <span className="vizel-block-menu-item-icon">
          <VizelIcon name={spec.submenuTrigger.iconName} />
        </span>
        <span className="vizel-block-menu-item-label">{spec.submenuTrigger.label}</span>
      </button>

      {showTurnInto && spec.submenu.sections.length > 0 && (
        <div
          ref={submenuRef}
          className={`vizel-block-menu-submenu${submenuFlipped ? " vizel-block-menu-submenu--left" : ""}`}
          role="menu"
          aria-label={spec.submenu.root["aria-label"]}
        >
          {spec.submenu.sections.flatMap((section) =>
            section.items.map((slot) => (
              <button
                key={slot.key}
                type="button"
                className="vizel-block-menu-item"
                role={slot.attrs.role}
                onClick={() => handleTurnInto(slot.data.nodeType)}
              >
                <span className="vizel-block-menu-item-icon">
                  <VizelIcon name={slot.data.nodeType.icon} />
                </span>
                <span className="vizel-block-menu-item-label">{slot.data.nodeType.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

VizelBlockMenu.displayName = "VizelBlockMenu";
