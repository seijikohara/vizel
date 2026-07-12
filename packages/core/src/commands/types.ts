import type { Editor } from "@tiptap/core";

import type { VizelLocale } from "../i18n/types.ts";
import type { VizelIconName } from "../icons/types.ts";

/**
 * Platform-specific keyboard shortcut.
 *
 * Format follows Tiptap's keymap notation: `Mod` resolves to `Cmd` on
 * macOS and `Ctrl` elsewhere; `Alt` and `Shift` carry their usual
 * meaning. Examples: `"Mod-B"`, `"Mod-Shift-1"`, `"Alt-ArrowUp"`.
 *
 * Both fields are required because some shortcuts intentionally differ
 * across platforms (for example, find-and-replace bound to `"Mod-F"`
 * on macOS and `"Ctrl-H"` elsewhere). When the two values coincide,
 * set both to the same string.
 */
export interface VizelShortcut {
  /** Shortcut string for macOS. */
  readonly mac: string;
  /** Shortcut string for non-macOS platforms (Windows / Linux). */
  readonly other: string;
}

/**
 * Set of surfaces a {@link VizelCommand} participates in.
 *
 * Every surface entry is optional; absence means the command does not
 * appear on that surface. Each entry carries surface-specific tuning
 * such as `priority` (lower number = earlier position) and, for the
 * bubble menu, a `showWhen` predicate that hides the action when the
 * current selection does not warrant it.
 */
export interface VizelCommandSurfaceSet {
  /** Show the command in the slash menu. */
  readonly slashMenu?: { readonly priority?: number };
  /** Show the command in the editor toolbar. */
  readonly toolbar?: { readonly priority?: number };
  /** Show the command in the bubble menu when text is selected. */
  readonly bubbleMenu?: {
    readonly priority?: number;
    /** Hide the action when the predicate returns `false`. */
    readonly showWhen?: (editor: Editor) => boolean;
  };
  /** Show the command in the block-level kebab menu. */
  readonly blockMenu?: { readonly priority?: number };
  /** Register the command's `shortcut` as a Tiptap keybinding. */
  readonly shortcut?: true;
}

/**
 * Unified runtime-bearing command shared across editor surfaces.
 *
 * A single `VizelCommand` defines one user action for the slash item,
 * toolbar action, bubble menu action, block menu action, and shortcut
 * binding at once. Surface-specific builders
 * (`buildVizelSlashMenuSpecFromCommands`, `buildVizelToolbarSpec`,
 * `buildVizelBubbleMenuSpec`,
 * `buildVizelBlockMenuSpecFromCommands`) consume `VizelCommand[]` and derive the
 * matching spec shapes; `registerVizelShortcuts` consumes the same
 * list to wire keyboard bindings.
 *
 * @example
 * ```ts
 * const boldCommand: VizelCommand = {
 *   id: "format/bold",
 *   label: (locale) => locale.toolbar.bold,
 *   icon: "bold",
 *   shortcut: { mac: "Mod-B", other: "Mod-B" },
 *   canRun: (editor) => editor.can().toggleBold(),
 *   isActive: (editor) => editor.isActive("bold"),
 *   run: (editor) => editor.chain().focus().toggleBold().run(),
 *   surfaces: {
 *     toolbar: { priority: 10 },
 *     bubbleMenu: { priority: 10 },
 *     shortcut: true,
 *   },
 * };
 * ```
 */
export interface VizelCommand {
  /** Stable identifier shared across surfaces (e.g. `"format/bold"`). */
  readonly id: string;
  /** Localized display label. */
  readonly label: (locale: VizelLocale) => string;
  /** Optional secondary line (slash menu description, tooltip hint). */
  readonly description?: (locale: VizelLocale) => string;
  /** Optional icon identifier resolved by the icon catalog. */
  readonly icon?: VizelIconName;
  /** Group key for slash menu sections and other categorized surfaces. */
  readonly group?: string;
  /** Fuzzy-match keywords used by slash menu filtering. */
  readonly keywords?: readonly string[];
  /** Optional keyboard shortcut. Bound only when `surfaces.shortcut === true`. */
  readonly shortcut?: VizelShortcut;
  /** Whether the command can currently run against the editor. */
  readonly canRun: (editor: Editor) => boolean;
  /** Whether the command's mark / node is currently active at the selection. */
  readonly isActive?: (editor: Editor) => boolean;
  /** Execute the command. Returns whether the command applied. */
  readonly run: (editor: Editor) => boolean;
  /** Surfaces the command appears on. */
  readonly surfaces: VizelCommandSurfaceSet;
}
