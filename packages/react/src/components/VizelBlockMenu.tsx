import type { Editor } from "@vizel/core";
import {
  clampMenuPosition,
  createVizelBlockMenuActions,
  createVizelNodeTypes,
  getVizelTurnIntoOptions,
  groupVizelBlockMenuActions,
  shouldFlipSubmenu,
  VIZEL_BLOCK_MENU_EVENT,
  type VizelBlockMenuAction,
  type VizelBlockMenuOpenDetail,
  type VizelLocale,
  type VizelNodeTypeOption,
  vizelDefaultBlockMenuActions,
  vizelDefaultNodeTypes,
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
 * Renders via fixed positioning near the drag handle.
 */
export function VizelBlockMenu({
  editor: editorProp,
  actions,
  nodeTypes,
  className,
  locale,
}: VizelBlockMenuProps): ReactNode {
  const context = useVizelContextSafe();
  const boundEditor: Editor | null = editorProp ?? context?.editor ?? null;
  // Memoize so locale-derived defaults aren't recomputed on every render.
  // createVizelBlockMenuActions / createVizelNodeTypes build new arrays each
  // call, which would invalidate downstream memos (groupVizelBlockMenuActions,
  // getVizelTurnIntoOptions) needlessly.
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

  // Listen for block menu open events from the drag handle
  useEffect(() => {
    const handler = (e: Event) => {
      if (!(e instanceof CustomEvent)) return;
      const detail = e.detail as VizelBlockMenuOpenDetail;
      // When this menu is bound to an editor (via prop or VizelProvider
      // context), ignore events from any other editor on the page. This
      // prevents sibling editors from cross-triggering each other's menus.
      if (boundEditor && detail.editor !== boundEditor) return;
      menuEditorRef.current = detail.editor;
      setMenuState({
        ...detail,
        x: detail.handleRect.left,
        y: detail.handleRect.bottom + 4,
      });
      setShowTurnInto(false);

      // Clamp menu position to viewport after DOM render
      requestAnimationFrame(() => {
        const el = menuRef.current;
        if (!el) return;
        const clamped = clampMenuPosition(detail.handleRect, el.offsetWidth, el.offsetHeight);
        setMenuState((prev) => (prev ? { ...prev, x: clamped.x, y: clamped.y } : prev));
      });
    };

    document.addEventListener(VIZEL_BLOCK_MENU_EVENT, handler);
    return () => document.removeEventListener(VIZEL_BLOCK_MENU_EVENT, handler);
  }, [boundEditor]);

  // Focus first menuitem when menu opens
  useEffect(() => {
    if (!(menuState && menuRef.current)) return;
    const firstItem = menuRef.current.querySelector<HTMLButtonElement>(
      '[role="menuitem"]:not([disabled])'
    );
    firstItem?.focus();
  }, [menuState]);

  // Close on outside click
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

  // Detect whether the submenu should flip to the left side
  useEffect(() => {
    if (!(showTurnInto && menuRef.current)) {
      setSubmenuFlipped(false);
      return;
    }
    requestAnimationFrame(() => {
      const parentRect = menuRef.current?.getBoundingClientRect();
      if (parentRect) {
        setSubmenuFlipped(shouldFlipSubmenu(parentRect, 200));
      }
    });
  }, [showTurnInto]);

  if (!menuState) return null;

  const { editor, pos, node } = menuState;
  const groups = groupVizelBlockMenuActions(effectiveActions);
  const turnIntoOptions = getVizelTurnIntoOptions(editor, effectiveNodeTypes);

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
    // Select the block first, then apply the transformation
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
      aria-label={locale?.blockMenu.label ?? "Block menu"}
      data-vizel-block-menu=""
      tabIndex={-1}
      onKeyDown={handleMenuKeyDown}
    >
      {groups.map((group, groupIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: groups are derived from a stable action list whose ordering is fixed at locale resolution time; the first-item `group` string we used before collided for two groups whose first member landed in the same category. Matches the Vue/Svelte block-menu key strategy.
        <div key={groupIndex}>
          {groupIndex > 0 && <div className="vizel-block-menu-divider" />}
          {group.map((action) => (
            <button
              key={action.id}
              type="button"
              className={`vizel-block-menu-item${action.id === "delete" ? " is-destructive" : ""}`}
              role="menuitem"
              onClick={() => handleAction(action)}
              disabled={action.isEnabled ? !action.isEnabled(editor, node) : false}
            >
              <span className="vizel-block-menu-item-icon">
                <VizelIcon name={action.icon} />
              </span>
              <span className="vizel-block-menu-item-label">{action.label}</span>
              {action.shortcut && (
                <span className="vizel-block-menu-item-shortcut">{action.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      ))}

      {/* Turn into submenu trigger */}
      <div className="vizel-block-menu-divider" />
      <button
        type="button"
        className="vizel-block-menu-item vizel-block-menu-submenu-trigger"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={showTurnInto}
        onMouseEnter={() => setShowTurnInto(true)}
        onClick={() => setShowTurnInto(!showTurnInto)}
      >
        <span className="vizel-block-menu-item-icon">
          <VizelIcon name="arrowRightLeft" />
        </span>
        <span className="vizel-block-menu-item-label">
          {locale?.blockMenu.turnInto ?? "Turn into"}
        </span>
      </button>

      {/* Turn into submenu */}
      {showTurnInto && turnIntoOptions.length > 0 && (
        <div
          ref={submenuRef}
          className={`vizel-block-menu-submenu${submenuFlipped ? " vizel-block-menu-submenu--left" : ""}`}
          role="menu"
          aria-label={locale?.blockMenu.turnInto ?? "Turn into"}
        >
          {turnIntoOptions.map((nodeType) => (
            <button
              key={nodeType.name}
              type="button"
              className="vizel-block-menu-item"
              role="menuitem"
              onClick={() => handleTurnInto(nodeType)}
            >
              <span className="vizel-block-menu-item-icon">
                <VizelIcon name={nodeType.icon} />
              </span>
              <span className="vizel-block-menu-item-label">{nodeType.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

VizelBlockMenu.displayName = "VizelBlockMenu";
