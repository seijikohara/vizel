import type { Editor } from "@tiptap/core";
import { deriveVizelCommandSpec } from "../commands/derive.ts";
import type { VizelCommand } from "../commands/types.ts";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelCommandSpec } from "./types.ts";

/**
 * Options accepted by {@link buildVizelToolbarSpec}.
 */
export interface VizelToolbarSpecOptions {
  /** Editor instance used for `canRun` / `isActive` resolution. */
  readonly editor: Editor;
  /** Locale supplying button labels and tooltips. */
  readonly locale: VizelLocale;
}

/**
 * Build the toolbar spec from a {@link VizelCommand} array.
 *
 * Filters by `surfaces.toolbar`, sorts by priority ascending (lower
 * priority appears first), and projects each command into a
 * {@link VizelCommandSpec}. The framework `VizelToolbar` component
 * iterates the result to render its buttons.
 */
export function buildVizelToolbarSpec(
  commands: readonly VizelCommand[],
  options: VizelToolbarSpecOptions
): readonly VizelCommandSpec[] {
  return commands
    .filter((command) => command.surfaces.toolbar !== undefined)
    .slice()
    .sort((a, b) => (a.surfaces.toolbar?.priority ?? 0) - (b.surfaces.toolbar?.priority ?? 0))
    .map((command) => deriveVizelCommandSpec(command, options.editor, options.locale));
}
