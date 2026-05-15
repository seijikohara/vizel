/**
 * UI skeleton specs.
 *
 * Each menu / form component in `@vizel/{react,vue,svelte}` is the same
 * DOM shape with framework-specific templating. The spec types in this
 * module describe that DOM shape declaratively so the structure, ARIA
 * attributes, and identifiers live in one place. Each framework adapter
 * is a thin transformer that maps the spec to its own template syntax.
 *
 * Specs do NOT include item *content* (icons, labels, descriptions) —
 * those vary per surface (mention avatar + name, slash icon + title +
 * description + shortcut, block-menu icon + label + shortcut, ...) and
 * the component owns rendering the inner view. The spec owns the
 * scaffolding around the items.
 */

/**
 * ARIA attributes accepted on the menu root element.
 */
export interface VizelMenuRootAttrs {
  role?: "listbox" | "menu";
  /** Localized label announced by assistive tech. */
  "aria-label"?: string;
  /**
   * Id of the currently focused option/menuitem. Set when the menu uses
   * roving keyboard focus via `aria-activedescendant`.
   */
  "aria-activedescendant"?: string;
  /** Optional explicit tabIndex on the root (useful for keyboard focus). */
  tabIndex?: number;
}

/**
 * ARIA attributes accepted on each item element inside the menu.
 */
export interface VizelMenuItemAttrs {
  role?: "option" | "menuitem";
  /** Whether this item is the active selection. */
  "aria-selected"?: boolean;
  /**
   * Whether this item is disabled (skipped by keyboard navigation,
   * non-activatable).
   */
  "aria-disabled"?: boolean;
  /**
   * Marks a menuitem that opens a popup (submenu). The value names the
   * popup's role; for nested menus this is typically `"menu"`.
   */
  "aria-haspopup"?: "menu" | "true";
  /**
   * Whether the popup associated with this item is currently open.
   * Set together with `aria-haspopup`.
   */
  "aria-expanded"?: boolean;
  /** Stable per-option id matching the root's `aria-activedescendant`. */
  id?: string;
  /** Item tabIndex; usually `-1` so the root owns keyboard focus. */
  tabIndex?: number;
}

/**
 * A single item slot in the menu spec.
 *
 * The spec carries the *identifying* shape: a stable key, ARIA attrs,
 * selection / disabled flags, plus an `index` into the original item
 * array so the framework component can call its existing
 * `selectItem(index)` from the click / Enter handler. Item rendering
 * (icon, label, description, etc.) is the component's job — the spec
 * passes the original item view back through `data`.
 */
export interface VizelMenuItemSpec<TData> {
  /** Stable key (used as React/Vue/Svelte iteration key). */
  key: string;
  /** Original-array index for activation wiring. */
  index: number;
  /** ARIA attributes for the item element. */
  attrs: VizelMenuItemAttrs;
  /** Item-specific data (label, icon name, etc.) passed to the consumer. */
  data: TData;
}

/**
 * A group of items rendered together, optionally preceded by a header.
 *
 * For ungrouped menus (e.g. mention suggestions), the spec carries a
 * single section with no header.
 */
export interface VizelMenuSectionSpec<TData> {
  /** Stable key (used as iteration key for the section element). */
  key: string;
  /** Group header label (omitted for ungrouped menus). */
  header?: { label: string };
  /** Items in this section. */
  items: readonly VizelMenuItemSpec<TData>[];
}

/**
 * The complete menu spec: root container attrs + sections.
 *
 * Empty menus (e.g. "no results" state) are represented by an empty
 * `sections` array; the framework component renders an empty-state slot.
 */
export interface VizelMenuSpec<TData> {
  /** ARIA attrs for the root container. */
  root: VizelMenuRootAttrs;
  /** Sections (groups) of items. Empty when there are no items. */
  sections: readonly VizelMenuSectionSpec<TData>[];
}
