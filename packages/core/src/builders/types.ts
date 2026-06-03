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

// ============================================================================
// VizelPopoverSpec
// ============================================================================

/**
 * ARIA attributes for the trigger element of a popover.
 *
 * The trigger anchors the floating body element. Click, keyboard, or
 * focus opens the body; the framework component owns the activation
 * behavior while the spec carries the static wiring.
 */
export interface VizelPopoverTriggerSpec {
  /** Stable id; used as `aria-controls` target by the body. */
  id: string;
  /** Role of the popup element this trigger opens. */
  "aria-haspopup": "listbox" | "menu" | "dialog";
  /** Whether the body is currently visible. */
  "aria-expanded": boolean;
  /** Id of the body element this trigger controls. */
  "aria-controls": string;
}

/**
 * ARIA attributes for the floating body element of a popover.
 */
export interface VizelPopoverBodySpec {
  /** Stable id matching the trigger's `aria-controls`. */
  id: string;
  /** Body's role; aligns with the trigger's `aria-haspopup`. */
  role: "dialog" | "listbox" | "menu";
  /** Optional label source for assistive tech. */
  "aria-labelledby"?: string;
}

/**
 * Spec for an anchored popover.
 *
 * Block menu, toolbar dropdown, node selector, and color picker all wrap
 * a body element (listbox / menu / dialog) anchored to a trigger button.
 * The spec covers the trigger-body wiring; the body itself is described
 * by a nested {@link VizelMenuSpec}, {@link VizelGridSpec}, or
 * {@link VizelFormSpec}.
 */
export interface VizelPopoverSpec {
  /** Trigger element wiring. */
  readonly trigger: VizelPopoverTriggerSpec;
  /** Body element wiring. */
  readonly body: VizelPopoverBodySpec;
  /** Whether the body is currently mounted / visible. */
  readonly isOpen: boolean;
}

// ============================================================================
// VizelCommandSpec
// ============================================================================

/**
 * Platform-specific keyboard shortcut.
 *
 * Format follows Tiptap's keymap notation: `Mod` resolves to `Cmd` on
 * macOS and `Ctrl` elsewhere; `Alt` and `Shift` carry their usual
 * meaning. Examples: `Mod-B`, `Mod-Shift-1`, `Alt-ArrowUp`.
 *
 * The two fields exist because some commands intentionally differ
 * across platforms. When they coincide, set both to the same string.
 */
export interface VizelShortcutSpec {
  /** Shortcut string for macOS. */
  readonly mac: string;
  /** Shortcut string for other platforms (Windows / Linux). */
  readonly other: string;
}

/**
 * Actionable item shared across command surfaces.
 *
 * The same logical command appears in multiple surfaces (slash menu,
 * toolbar, bubble menu, block menu, keyboard shortcut). The spec
 * carries the view-only fields a renderer needs: identity, localized
 * label, optional description / icon / shortcut, classification group,
 * fuzzy-match keywords, and the runtime-evaluated enable / active
 * flags.
 *
 * `VizelCommand` carries the runtime-bearing form (`canRun`, `isActive`,
 * `run`); builders derive a `VizelCommandSpec` from a `VizelCommand` for
 * a specific editor instance, stripping the runtime fields so renderers
 * receive view-only data.
 */
export interface VizelCommandSpec {
  /** Stable identifier shared across surfaces (e.g. "format/bold"). */
  readonly id: string;
  /** Localized display label. */
  readonly label: string;
  /** Optional secondary line (slash menu description, tooltip hint). */
  readonly description?: string;
  /** Optional icon identifier resolved by the icon catalog. */
  readonly icon?: string;
  /** Optional keyboard shortcut hint. */
  readonly shortcut?: VizelShortcutSpec;
  /** Group key for slash menu sections, toolbar grouping, etc. */
  readonly group?: string;
  /** Fuzzy-match keywords used by slash menu filtering. */
  readonly keywords?: readonly string[];
  /** Whether the command can currently run against the editor. */
  readonly isEnabled: boolean;
  /** Whether the command's mark / node is currently active at the selection. */
  readonly isActive: boolean;
}

// ============================================================================
// VizelFormSpec
// ============================================================================

/**
 * ARIA attributes for a single form field.
 */
export interface VizelFormFieldAttrs {
  /** Stable id; matches the field's `<label for>`. */
  id: string;
  /** Field name used by `<form>` submission and aria. */
  name: string;
  /** Localized label announced by assistive tech. */
  "aria-label": string;
  /** Whether the field currently violates validation. */
  "aria-invalid"?: boolean;
  /** Id of an associated description element (often the error message). */
  "aria-describedby"?: string;
}

/**
 * Spec for a single form field.
 *
 * Generic over the value type so consumers can carry strings, numbers,
 * booleans, or richer value shapes without losing type safety.
 */
export interface VizelFormFieldSpec<TValue> {
  readonly attrs: VizelFormFieldAttrs;
  readonly value: TValue;
  /** Localized validation error message (paired with `aria-invalid`). */
  readonly errorMessage?: string;
}

/**
 * ARIA attributes for the form root.
 */
export interface VizelFormRootAttrs {
  /** Stable id; matches each field's `aria-describedby` when needed. */
  id: string;
  role: "form";
  /** Localized label for the form. */
  "aria-label": string;
}

/**
 * Spec for an inline input form.
 *
 * Used by link editor (`{ url, text, embed }`), find/replace
 * (`{ find, replace }`), and future forms. The `TFields` type
 * parameter constrains the field map so consumers get type-safe access
 * to each named field.
 */
export interface VizelFormSpec<TFields extends Record<string, VizelFormFieldSpec<unknown>>> {
  readonly root: VizelFormRootAttrs;
  readonly fields: TFields;
  /** Localized submit-button label. */
  readonly submitLabel: string;
  /** Localized cancel-button label, when the form supports cancel. */
  readonly cancelLabel?: string;
  /** Whether the submit action is currently allowed. */
  readonly canSubmit: boolean;
}

// ============================================================================
// VizelGridSpec
// ============================================================================

/**
 * ARIA attributes for a grid root.
 */
export interface VizelGridRootAttrs {
  id: string;
  role: "grid";
  "aria-label": string;
}

/**
 * ARIA attributes for a single grid cell.
 */
export interface VizelGridCellAttrs {
  role: "gridcell";
  /** Stable id; used by the root's `aria-activedescendant`. */
  id: string;
  /** Whether this cell is the active selection. */
  "aria-selected"?: boolean;
  /** Cell tabIndex; usually -1 so the root owns keyboard focus. */
  tabIndex: -1 | 0;
}

/**
 * Spec for a single cell inside a grid.
 *
 * Generic over the cell payload so consumers can carry color hex
 * codes, emoji descriptors, or richer cell data while keeping the
 * structural attrs uniform.
 */
export interface VizelGridCellSpec<TCell> {
  /** Stable iteration key. */
  readonly key: string;
  /** Zero-based row position. */
  readonly row: number;
  /** Zero-based column position. */
  readonly col: number;
  readonly attrs: VizelGridCellAttrs;
  readonly data: TCell;
}

/**
 * Spec for a two-dimensional grid (color picker, future emoji picker).
 *
 * Rows are arrays of cells in column order. Empty rows are allowed but
 * unusual; consumers typically pad the last row when the data does not
 * divide evenly.
 */
export interface VizelGridSpec<TCell> {
  readonly root: VizelGridRootAttrs;
  readonly rows: readonly (readonly VizelGridCellSpec<TCell>[])[];
  /** Currently focused cell position. */
  readonly focusedPosition: { readonly row: number; readonly col: number };
}
