import {
  buildVizelOutlineSpec,
  type Editor,
  type VizelLocale,
  type VizelOutlineItemSpec,
  vizelEnLocale,
} from "@vizel/core";
import { useVizelState } from "../hooks/useVizelState.ts";
import { useVizelContextSafe } from "./VizelContext.tsx";

export interface VizelOutlineProps {
  /** Editor instance. Falls back to the editor from `VizelProvider` / `Vizel` context if omitted. */
  editor?: Editor | null;
  /** Additional CSS class name */
  className?: string;
  /**
   * Override for the current document position used to highlight the
   * active heading. Defaults to `editor.state.selection.from`.
   */
  currentPos?: number | null;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * Sidebar-style outline view of every heading in the editor's document.
 */
export function VizelOutline({
  editor: editorProp,
  className,
  currentPos,
  locale,
}: VizelOutlineProps) {
  const contextEditor = useVizelContextSafe();
  const editor = editorProp ?? contextEditor;
  // Subscribe to editor transactions so the outline re-renders on doc /
  // selection changes. The numeric tick itself is intentionally unused.
  useVizelState(editor);

  if (!editor) return null;

  const resolvedLocale = locale ?? vizelEnLocale;
  const resolvedPos = currentPos === undefined ? editor.state.selection.from : currentPos;
  const spec = buildVizelOutlineSpec(editor, resolvedPos, resolvedLocale);

  return (
    <nav
      className={`vizel-outline ${className ?? ""}`}
      role={spec.root.role}
      aria-label={spec.root["aria-label"]}
      data-vizel-outline=""
    >
      {spec.items.length > 0 ? renderItems(spec.items, editor) : null}
    </nav>
  );
}

function renderItems(items: readonly VizelOutlineItemSpec[], editor: Editor) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA tree pattern requires role="group" on nested lists inside role="tree".
    <ul className="vizel-outline-list" role="group">
      {items.map((item) => (
        <li
          key={item.key}
          role="treeitem"
          tabIndex={-1}
          aria-level={item.level}
          aria-selected={item.isCurrent}
          {...(item.isCurrent && { "aria-current": "true" as const })}
          className={`vizel-outline-item vizel-outline-item--level-${item.level}${
            item.isCurrent ? " vizel-outline-item--current" : ""
          }`}
        >
          <button
            type="button"
            className="vizel-outline-link"
            onClick={() => {
              editor
                .chain()
                .focus()
                .setTextSelection(item.pos + 1)
                .run();
            }}
          >
            {item.label}
          </button>
          {item.children.length > 0 ? renderItems(item.children, editor) : null}
        </li>
      ))}
    </ul>
  );
}
