/**
 * Vizel Feature Manifest
 *
 * Single Source of Truth (SSOT) for cross-framework feature parity.
 * Every advertised Vizel feature has one entry below. The script
 * `scripts/check-feature-parity.ts` verifies that every adapter
 * (`@vizel/react`, `@vizel/vue`, `@vizel/svelte`) exports the declared
 * symbol for every entry.
 *
 * The manifest replaces prose parity tables with type-checked entries
 * so an adapter can never silently drift from the declared surface.
 * ADR-0001, ADR-0002, and ADR-0006 explain the rationale; the companion
 * rule `.claude/rules/feature-manifest.md` documents the workflow for
 * adding, modifying, and removing features.
 */

/** Stable identifier for every advertised Vizel feature. */
export type VizelFeatureId =
  | "editor-core"
  | "bubble-menu"
  | "slash-menu"
  | "mention-menu"
  | "block-menu"
  | "toolbar"
  | "toolbar-dropdown"
  | "toolbar-overflow"
  | "node-selector"
  | "link-editor"
  | "find-replace"
  | "color-picker"
  | "outline"
  | "embed-view"
  | "save-indicator"
  | "portal"
  | "theme"
  | "auto-save"
  | "collaboration"
  | "comment"
  | "version-history"
  | "icon"
  | "provider";

/** Category that groups features by their UI role. */
export type VizelFeatureCategory =
  | "engine"
  | "menu"
  | "popover"
  | "toolbar"
  | "overlay"
  | "form"
  | "infrastructure";

/**
 * Accessibility contract for a feature's root element.
 *
 * `scripts/check-aria-contract.ts` statically enforces this contract: it
 * resolves each adapter component for the feature and asserts that the
 * declared `role` and every `requiredAttributes` entry appears in the
 * component source — either as a literal attribute or through the
 * feature's resolved builder spec. The check verifies presence in source,
 * not the rendered Document Object Model (DOM).
 *
 * Runtime enforcement (axe assertions and keyboard-interaction tests on
 * the live DOM) is planned as Phase 2 and is deferred to the
 * accessibility Continuous Integration (CI) follow-up; this contract does
 * not yet guarantee runtime behaviour.
 */
export interface VizelAriaContract {
  /** Optional ARIA role applied to the feature's root element. */
  readonly role?: string;
  /** Attributes the feature exposes for accessibility. */
  readonly requiredAttributes: readonly string[];
}

/**
 * Keyboard bindings keyed by canonical command name.
 *
 * Each key names a command the feature responds to; the value lists the
 * `KeyboardEvent.key` values bound to that command.
 * `scripts/check-aria-contract.ts` statically asserts that every key
 * belongs to the allow-list formed by the union of the `VizelCommand`
 * registry identifiers under `packages/core/src/commands/registry/` and
 * the navigation-verb vocabulary in `VIZEL_KEYBOARD_COMMANDS`, so a
 * binding name cannot rot into a string the editor never handles.
 *
 * Runtime enforcement (asserting each key actually triggers its command
 * against the live editor) is planned as Phase 2 and is deferred to the
 * accessibility CI follow-up.
 */
export interface VizelKeyboardMap {
  readonly bindings: Readonly<Record<string, readonly string[]>>;
}

/**
 * Canonical navigation-verb vocabulary for {@link VizelKeyboardMap} keys.
 *
 * The manifest binds menus, popovers, and forms to abstract interaction
 * verbs rather than to `VizelCommand` registry identifiers — a slash menu
 * binds `next`/`previous`/`confirm`/`close`, not `format/bold`. This const
 * is the Single Source of Truth (SSOT) for those verbs;
 * `scripts/check-aria-contract.ts` reads it to validate every keyboard-map
 * key, so adding a new verb requires extending this list.
 */
export const VIZEL_KEYBOARD_COMMANDS = ["next", "previous", "confirm", "submit", "close"] as const;

/** A canonical navigation verb usable as a {@link VizelKeyboardMap} key. */
export type VizelKeyboardCommand = (typeof VIZEL_KEYBOARD_COMMANDS)[number];

/** Public symbol that an adapter exports for a feature. */
export interface VizelAdapterSymbol {
  /** Component or root export from the adapter's `src/index.ts`. */
  readonly component?: string;
  /** Hook (React, Vue) or rune factory (Svelte) that accompanies the component. */
  readonly companion?: string;
}

/** Per-framework adapter declaration for a single feature. */
export interface VizelFeatureAdapters {
  readonly react: VizelAdapterSymbol;
  readonly vue: VizelAdapterSymbol;
  readonly svelte: VizelAdapterSymbol;
}

/** Single feature definition consumed by `pnpm check:feature-parity`. */
export interface VizelFeatureDefinition {
  readonly id: VizelFeatureId;
  readonly category: VizelFeatureCategory;
  readonly description: string;
  readonly ariaContract: VizelAriaContract;
  readonly keyboardMap: VizelKeyboardMap;
  /**
   * Scenario identifiers under `tests/ct/scenarios/<feature-id>/`.
   * An entry may stay empty until its scenario folder is populated.
   */
  readonly scenarios: readonly string[];
  readonly adapters: VizelFeatureAdapters;
}

const EMPTY_KEYBOARD_MAP: VizelKeyboardMap = { bindings: {} };

/**
 * The authoritative feature catalogue. Add, modify, and remove entries
 * here together with the corresponding adapter and scenario changes;
 * the parity check fails the build when an adapter omits a declared
 * symbol.
 */
export const VIZEL_FEATURE_MANIFEST: readonly VizelFeatureDefinition[] = [
  {
    id: "editor-core",
    category: "engine",
    description: "Editor instance bound to the framework lifecycle.",
    ariaContract: { requiredAttributes: [] },
    keyboardMap: EMPTY_KEYBOARD_MAP,
    scenarios: ["lifecycle", "markdown-roundtrip"],
    adapters: {
      react: { component: "VizelEditor", companion: "useVizelEditor" },
      vue: { component: "VizelEditor", companion: "useVizelEditor" },
      svelte: { component: "VizelEditor", companion: "createVizelEditor" },
    },
  },
  {
    id: "bubble-menu",
    category: "menu",
    description: "Floating menu surfaced when the user makes a non-empty text selection.",
    // A row of formatting toggle buttons is a WAI-ARIA toolbar, not a
    // menu; every adapter renders role="toolbar".
    ariaContract: { role: "toolbar", requiredAttributes: ["aria-label"] },
    keyboardMap: { bindings: { close: ["Escape"] } },
    scenarios: ["render", "selection-tracking", "keyboard-dismiss"],
    adapters: {
      react: { component: "VizelBubbleMenu" },
      vue: { component: "VizelBubbleMenu" },
      svelte: { component: "VizelBubbleMenu" },
    },
  },
  {
    id: "slash-menu",
    category: "menu",
    description: "Command palette that opens after the user types '/'.",
    ariaContract: {
      role: "listbox",
      requiredAttributes: ["aria-activedescendant", "aria-label"],
    },
    keyboardMap: {
      bindings: {
        next: ["ArrowDown"],
        previous: ["ArrowUp"],
        confirm: ["Enter"],
        close: ["Escape"],
      },
    },
    scenarios: ["render", "filter", "keyboard-navigation", "confirm-selection"],
    adapters: {
      react: { component: "VizelSlashMenu" },
      vue: { component: "VizelSlashMenu" },
      svelte: { component: "VizelSlashMenu" },
    },
  },
  {
    id: "mention-menu",
    category: "menu",
    description: "Suggestion popover that opens after the user types the mention trigger.",
    ariaContract: {
      role: "listbox",
      requiredAttributes: ["aria-activedescendant", "aria-label"],
    },
    keyboardMap: {
      bindings: {
        next: ["ArrowDown"],
        previous: ["ArrowUp"],
        confirm: ["Enter"],
        close: ["Escape"],
      },
    },
    scenarios: ["render", "filter", "keyboard-navigation"],
    adapters: {
      react: { component: "VizelMentionMenu" },
      vue: { component: "VizelMentionMenu" },
      svelte: { component: "VizelMentionMenu" },
    },
  },
  {
    id: "block-menu",
    category: "menu",
    description: "Block-level action menu surfaced by the drag handle.",
    ariaContract: { role: "menu", requiredAttributes: ["aria-label"] },
    keyboardMap: { bindings: { close: ["Escape"] } },
    scenarios: ["render", "block-actions", "keyboard-dismiss"],
    adapters: {
      react: { component: "VizelBlockMenu" },
      vue: { component: "VizelBlockMenu" },
      svelte: { component: "VizelBlockMenu" },
    },
  },
  {
    id: "toolbar",
    category: "toolbar",
    description: "Top-level toolbar that renders formatting and block actions.",
    ariaContract: { role: "toolbar", requiredAttributes: ["aria-label"] },
    keyboardMap: { bindings: {} },
    scenarios: ["render", "action-invocation"],
    adapters: {
      react: { component: "VizelToolbar" },
      vue: { component: "VizelToolbar" },
      svelte: { component: "VizelToolbar" },
    },
  },
  {
    id: "toolbar-dropdown",
    category: "popover",
    description: "Dropdown surface used inside the toolbar for grouped actions.",
    // The body renders role="option" rows with aria-selected and the
    // trigger advertises aria-haspopup="listbox"; the surface is a
    // single-select listbox, not a menu.
    ariaContract: {
      role: "listbox",
      requiredAttributes: ["aria-expanded", "aria-haspopup"],
    },
    keyboardMap: {
      bindings: {
        next: ["ArrowDown"],
        previous: ["ArrowUp"],
        close: ["Escape"],
      },
    },
    scenarios: ["render", "keyboard-navigation", "keyboard-dismiss"],
    adapters: {
      react: { component: "VizelToolbarDropdown" },
      vue: { component: "VizelToolbarDropdown" },
      svelte: { component: "VizelToolbarDropdown" },
    },
  },
  {
    id: "toolbar-overflow",
    category: "toolbar",
    description: "Overflow controller that collapses toolbar items into a secondary menu.",
    ariaContract: { requiredAttributes: ["aria-label"] },
    keyboardMap: { bindings: {} },
    scenarios: ["render", "overflow-resize"],
    adapters: {
      react: { component: "VizelToolbarOverflow" },
      vue: { component: "VizelToolbarOverflow" },
      svelte: { component: "VizelToolbarOverflow" },
    },
  },
  {
    id: "node-selector",
    category: "popover",
    description: "Selector for swapping the current block's node type.",
    // The body renders role="option" rows with aria-selected and the
    // trigger advertises aria-haspopup="listbox"; the surface is a
    // single-select listbox, not a menu.
    ariaContract: {
      role: "listbox",
      requiredAttributes: ["aria-expanded", "aria-haspopup"],
    },
    keyboardMap: {
      bindings: {
        next: ["ArrowDown"],
        previous: ["ArrowUp"],
        confirm: ["Enter"],
        close: ["Escape"],
      },
    },
    scenarios: ["render", "selection-change"],
    adapters: {
      react: { component: "VizelNodeSelector" },
      vue: { component: "VizelNodeSelector" },
      svelte: { component: "VizelNodeSelector" },
    },
  },
  {
    id: "link-editor",
    category: "form",
    description: "Inline form for editing the current link mark.",
    ariaContract: { requiredAttributes: ["aria-label"] },
    keyboardMap: {
      bindings: {
        submit: ["Enter"],
        close: ["Escape"],
      },
    },
    scenarios: ["render", "submit", "remove-link", "keyboard-dismiss"],
    adapters: {
      react: { component: "VizelLinkEditor" },
      vue: { component: "VizelLinkEditor" },
      svelte: { component: "VizelLinkEditor" },
    },
  },
  {
    id: "find-replace",
    category: "overlay",
    description: "Find-and-replace panel that searches and rewrites editor content.",
    // The panel is non-modal: it coexists with live editing and never
    // renders the document inert, so it must not claim aria-modal.
    ariaContract: {
      role: "dialog",
      requiredAttributes: ["aria-label"],
    },
    keyboardMap: {
      bindings: {
        next: ["Enter"],
        close: ["Escape"],
      },
    },
    scenarios: ["render", "find", "replace", "replace-all"],
    adapters: {
      react: { component: "VizelFindReplace" },
      vue: { component: "VizelFindReplace" },
      svelte: { component: "VizelFindReplace" },
    },
  },
  {
    id: "color-picker",
    category: "popover",
    description: "Colour picker surface used by toolbar and bubble-menu colour controls.",
    ariaContract: { requiredAttributes: ["aria-label"] },
    keyboardMap: { bindings: { close: ["Escape"] } },
    scenarios: ["render", "select-colour", "keyboard-dismiss"],
    adapters: {
      react: { component: "VizelColorPicker" },
      vue: { component: "VizelColorPicker" },
      svelte: { component: "VizelColorPicker" },
    },
  },
  {
    id: "outline",
    category: "infrastructure",
    description: "Document outline panel that summarises the heading structure.",
    // The builder spec types role="tree" and the component renders
    // role="treeitem" / role="group" children, a WAI-ARIA tree, not a
    // navigation landmark.
    ariaContract: {
      role: "tree",
      requiredAttributes: ["aria-label"],
    },
    keyboardMap: { bindings: {} },
    scenarios: ["render", "heading-tracking"],
    adapters: {
      react: { component: "VizelOutline" },
      vue: { component: "VizelOutline" },
      svelte: { component: "VizelOutline" },
    },
  },
  {
    id: "embed-view",
    category: "infrastructure",
    description: "Node view that renders embedded content (images, diagrams, etc.).",
    ariaContract: { requiredAttributes: [] },
    keyboardMap: { bindings: {} },
    scenarios: ["render-image", "render-diagram"],
    adapters: {
      react: { component: "VizelEmbedView" },
      vue: { component: "VizelEmbedView" },
      svelte: { component: "VizelEmbedView" },
    },
  },
  {
    id: "save-indicator",
    category: "infrastructure",
    description: "Status indicator that visualises auto-save progress.",
    ariaContract: {
      role: "status",
      requiredAttributes: ["aria-live"],
    },
    keyboardMap: { bindings: {} },
    scenarios: ["render", "status-transitions"],
    adapters: {
      react: { component: "VizelSaveIndicator" },
      vue: { component: "VizelSaveIndicator" },
      svelte: { component: "VizelSaveIndicator" },
    },
  },
  {
    id: "portal",
    category: "infrastructure",
    description: "Portal primitive that renders children into a detached DOM root.",
    ariaContract: { requiredAttributes: [] },
    keyboardMap: { bindings: {} },
    scenarios: ["render", "unmount-cleanup"],
    adapters: {
      react: { component: "VizelPortal" },
      vue: { component: "VizelPortal" },
      svelte: { component: "VizelPortal" },
    },
  },
  {
    id: "theme",
    category: "infrastructure",
    description: "Theme provider and resolver bound to the `data-vizel-theme` attribute.",
    ariaContract: { requiredAttributes: [] },
    keyboardMap: { bindings: {} },
    scenarios: ["resolve-light", "resolve-dark", "system-preference"],
    adapters: {
      react: { component: "VizelThemeProvider", companion: "useVizelTheme" },
      vue: { component: "VizelThemeProvider", companion: "useVizelTheme" },
      svelte: { component: "VizelThemeProvider", companion: "getVizelTheme" },
    },
  },
  {
    id: "auto-save",
    category: "infrastructure",
    description: "Auto-save lifecycle that persists Markdown to a configured backend.",
    ariaContract: { requiredAttributes: [] },
    keyboardMap: { bindings: {} },
    scenarios: ["debounce", "persist", "restore"],
    adapters: {
      react: { companion: "useVizelAutoSave" },
      vue: { companion: "useVizelAutoSave" },
      svelte: { companion: "createVizelAutoSave" },
    },
  },
  {
    id: "collaboration",
    category: "infrastructure",
    description: "Yjs-backed collaboration channel for multi-user editing.",
    ariaContract: { requiredAttributes: [] },
    keyboardMap: { bindings: {} },
    scenarios: ["join", "remote-update", "presence"],
    adapters: {
      react: { companion: "useVizelCollaboration" },
      vue: { companion: "useVizelCollaboration" },
      svelte: { companion: "createVizelCollaboration" },
    },
  },
  {
    id: "comment",
    category: "infrastructure",
    description: "Comment thread overlay anchored to selection ranges.",
    ariaContract: { requiredAttributes: ["aria-label"] },
    keyboardMap: { bindings: {} },
    scenarios: ["create-thread", "resolve-thread"],
    adapters: {
      react: { companion: "useVizelComment" },
      vue: { companion: "useVizelComment" },
      svelte: { companion: "createVizelComment" },
    },
  },
  {
    id: "version-history",
    category: "infrastructure",
    description: "Version-history surface that snapshots and restores Markdown revisions.",
    ariaContract: { requiredAttributes: ["aria-label"] },
    keyboardMap: { bindings: {} },
    scenarios: ["snapshot", "restore"],
    adapters: {
      react: { companion: "useVizelVersionHistory" },
      vue: { companion: "useVizelVersionHistory" },
      svelte: { companion: "createVizelVersionHistory" },
    },
  },
  {
    id: "icon",
    category: "infrastructure",
    description: "Icon component bound to the icon registry.",
    ariaContract: { requiredAttributes: [] },
    keyboardMap: { bindings: {} },
    scenarios: ["render-default", "render-custom-registry"],
    adapters: {
      react: { component: "VizelIcon", companion: "useVizelIconContext" },
      vue: { component: "VizelIcon", companion: "useVizelIconContext" },
      svelte: { component: "VizelIcon", companion: "getVizelIconContext" },
    },
  },
  {
    id: "provider",
    category: "infrastructure",
    description:
      "Top-level provider that exposes editor, locale, theme, and icons through context.",
    ariaContract: { requiredAttributes: [] },
    keyboardMap: { bindings: {} },
    scenarios: ["expose-editor", "expose-locale", "expose-theme"],
    adapters: {
      react: { component: "VizelProvider", companion: "useVizelContext" },
      vue: { component: "VizelProvider", companion: "useVizelContext" },
      svelte: { component: "VizelProvider", companion: "getVizelContext" },
    },
  },
];
