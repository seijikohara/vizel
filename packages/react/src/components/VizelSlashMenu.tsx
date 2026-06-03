import {
  buildVizelSlashMenuSpecFromCommands,
  type Editor,
  getNextVizelSlashMenuGroupIndex,
  type VizelCommand,
  type VizelCommandSpec,
  type VizelLocale,
} from "@vizel/core";
import { buildVizelComboboxKeySpec } from "@vizel/headless/combobox";
import type { ReactNode, Ref } from "react";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { VizelSlashMenuEmpty } from "./VizelSlashMenuEmpty.tsx";
import { VizelSlashMenuItem, type VizelSlashMenuItemProps } from "./VizelSlashMenuItem.tsx";

export interface VizelSlashMenuRef {
  /**
   * Handle keyboard navigation events.
   * The renderer forwards the raw `KeyboardEvent`. React, Vue, and Svelte
   * share the raw-event signature so the renderer wires the same way in
   * every adapter.
   */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface VizelSlashMenuProps {
  /** Ref to access menu methods */
  ref?: Ref<VizelSlashMenuRef>;
  /** Commands surfaced in the menu (filtered by `query` internally). */
  commands: readonly VizelCommand[];
  /** Editor the commands evaluate `canRun` / `isActive` against. */
  editor: Editor;
  /** Locale supplying command `label` / `description` strings. */
  locale: VizelLocale;
  /** Current query string. */
  query: string;
  /** Select a command by its `VizelCommandSpec.id`. */
  onSelect: (id: string) => void;
  /** Custom class name for the menu container */
  className?: string;
  /** Whether to show items grouped by category (default: true when not searching) */
  showGroups?: boolean;
  /** Custom render function for items */
  renderItem?: (props: {
    item: VizelCommandSpec;
    isSelected: boolean;
    onClick: () => void;
  }) => ReactNode;
  /** Custom empty state component */
  renderEmpty?: () => ReactNode;
  /** Custom group order */
  groupOrder?: string[];
}

/**
 * Slash command menu component for displaying command suggestions.
 *
 * DOM scaffolding (listbox container, section grouping, item identity
 * + index) comes from `@vizel/core`'s `buildVizelSlashMenuSpecFromCommands`;
 * this component is the React-flavored binding that maps the spec to
 * JSX. Item rendering (icon + label + description + shortcut) stays in
 * `VizelSlashMenuItem`, which keeps `role="option"` ownership.
 */
export function VizelSlashMenu({
  ref,
  commands,
  editor,
  locale,
  query,
  onSelect,
  className,
  showGroups = true,
  renderItem,
  renderEmpty,
  groupOrder,
}: VizelSlashMenuProps): ReactNode {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const spec = useMemo(
    () =>
      buildVizelSlashMenuSpecFromCommands(commands, {
        editor,
        locale,
        query,
        selectedIndex,
        showGroups,
        ...(groupOrder && { groupOrder }),
      }),
    [commands, editor, locale, query, selectedIndex, showGroups, groupOrder]
  );

  const flatItemCount = useMemo(
    () => spec.sections.reduce((sum, section) => sum + section.items.length, 0),
    [spec]
  );

  useEffect(() => {
    if (itemRefs.current.length > flatItemCount) {
      itemRefs.current.length = flatItemCount;
    }
  }, [flatItemCount]);

  useEffect(() => {
    const selectedElement = itemRefs.current[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset selection when the query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const selectItem = useCallback(
    (index: number) => {
      const slot = spec.sections.flatMap((s) => s.items).find((s) => s.index === index);
      if (slot) {
        onSelect(slot.data.id);
      }
    },
    [spec, onSelect]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      // The combobox resolver returns `null` for unknown keys *and* for
      // `flatItemCount === 0`, so the empty-menu case falls through and lets
      // Tiptap consume the key. `groupNext` (Tab) carries the slash-only
      // group jump; `close` (Escape) is reported unhandled because the menu
      // has no own close path — Tiptap dismisses it.
      const action = buildVizelComboboxKeySpec({
        key: event.key,
        currentIndex: selectedIndex,
        length: flatItemCount,
      });
      if (action === null) return false;
      switch (action.type) {
        case "navigate":
          setSelectedIndex(action.index);
          return true;
        case "select":
          selectItem(action.index);
          return true;
        case "groupNext":
          event.preventDefault();
          setSelectedIndex(getNextVizelSlashMenuGroupIndex(spec, selectedIndex));
          return true;
        default:
          return false;
      }
    },
  }));

  if (spec.sections.length === 0) {
    return (
      <div
        className={`vizel-slash-menu ${className ?? ""}`}
        data-vizel-slash-menu=""
        role="listbox"
        aria-label={spec.root["aria-label"]}
      >
        {renderEmpty?.() ?? <VizelSlashMenuEmpty />}
      </div>
    );
  }

  return (
    <div
      className={`vizel-slash-menu ${className ?? ""}`}
      data-vizel-slash-menu=""
      role="listbox"
      aria-label={spec.root["aria-label"]}
      {...(spec.root["aria-activedescendant"] && {
        "aria-activedescendant": spec.root["aria-activedescendant"],
      })}
    >
      {spec.sections.map((section) => {
        const renderedItems = section.items.map((slot) => {
          const onClick = () => selectItem(slot.index);
          const isSelected = slot.attrs["aria-selected"] === true;
          const content = renderItem ? (
            renderItem({ item: slot.data, isSelected, onClick })
          ) : (
            <VizelSlashMenuItem
              item={slot.data}
              isSelected={isSelected}
              onClick={onClick}
              id={slot.attrs.id}
            />
          );
          return (
            <div
              key={slot.key}
              ref={(el) => {
                itemRefs.current[slot.index] = el;
              }}
            >
              {content}
            </div>
          );
        });

        if (!section.header) {
          return renderedItems;
        }

        return (
          <div key={section.key} className="vizel-slash-menu-group" data-vizel-slash-menu-group="">
            <div className="vizel-slash-menu-group-header">{section.header.label}</div>
            {renderedItems}
          </div>
        );
      })}
    </div>
  );
}

// Re-export VizelSlashMenuItem props for consumers
export type { VizelSlashMenuItemProps };
