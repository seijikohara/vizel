import {
  buildVizelOutlineSpec,
  type Editor,
  type VizelLocale,
  type VizelOutlineItemSpec,
  vizelEnLocale,
} from "@vizel/core";
import { useMemo } from "react";
import { useVizelEditorState } from "../_reactivity.ts";
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
  const resolvedLocale = locale ?? vizelEnLocale;

  // Gate re-renders on a doc-and-selection signature read through the
  // flagship `useVizelEditorState` primitive (ADR-0004), replacing the
  // coarse `useVizelState` tick. The signature changes whenever a
  // heading is edited or the caret moves, which is exactly when the
  // outline's entries or active highlight must update; transactions that
  // leave both unchanged short-circuit through the default `Object.is`
  // equality. `buildVizelOutlineSpec` returns a nested spec, so a
  // selector that returned the spec object directly could not be
  // memoised by a shallow comparator — deriving a primitive signature
  // keeps the subscription stable.
  const signature = useVizelEditorState(
    (current) => (current === null ? null : buildVizelOutlineSignature(current)),
    { editor }
  );

  // `signature` joins the dependency list as a reactive stand-in for the
  // editor's mutable doc / selection state: it changes with every heading
  // edit or caret move, so the memo rebuilds the spec from the live editor
  // even though the `editor` identity stays stable.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `signature` is the reactive trigger for re-reading the editor's doc/selection, which `buildVizelOutlineSpec` reads off the live editor.
  const spec = useMemo(() => {
    if (!editor) return null;
    const resolvedPos = currentPos === undefined ? editor.state.selection.from : currentPos;
    return buildVizelOutlineSpec(editor, resolvedPos, resolvedLocale);
  }, [editor, currentPos, resolvedLocale, signature]);

  if (!(editor && spec)) return null;

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

/**
 * Derive a primitive signature from the editor's headings and caret
 * position. The signature changes whenever a heading's level, position,
 * or text changes, or the caret moves — the exact inputs the outline
 * renders — so `useVizelEditorState` re-renders the component only when
 * the outline would visibly differ. The signature stays a string so the
 * hook's `Object.is` cache short-circuits transactions that leave the
 * outline unchanged (such as edits inside a non-heading paragraph that
 * do not shift heading positions).
 */
function buildVizelOutlineSignature(editor: Editor): string {
  const parts: string[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      const rawLevel = (node.attrs as { level?: number }).level;
      const level = typeof rawLevel === "number" ? rawLevel : 1;
      parts.push(`${level}:${pos}:${node.textContent}`);
    }
    return node.type.name !== "heading";
  });
  return `${editor.state.selection.from}|${parts.join("\n")}`;
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
