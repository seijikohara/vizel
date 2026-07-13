import type { Editor } from "@tiptap/core";

import { deriveVizelCommandSpec } from "../commands/derive.ts";
import type { VizelCommand } from "../commands/types.ts";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelCommandSpec } from "./types.ts";

/**
 * Options accepted by {@link buildVizelBlockMenuSpecFromCommands}.
 */
export interface VizelBlockMenuFromCommandsOptions {
  /** Editor instance used for `canRun` / `isActive` resolution. */
  readonly editor: Editor;
  /** Locale supplying labels. */
  readonly locale: VizelLocale;
}

/**
 * Build the block-menu action list from a {@link VizelCommand} array.
 *
 * Filters by `surfaces.blockMenu`, sorts by priority ascending, and
 * projects each command into a {@link VizelCommandSpec}.
 *
 * The framework `VizelBlockMenu` component composes the resulting
 * action list with the popover spec built by `buildVizelBlockMenuSpec`
 * (which carries the existing block-level metadata like "Turn into"
 * submenus). This helper only handles the action portion that flows
 * from the unified command registry.
 */
export function buildVizelBlockMenuSpecFromCommands(
  commands: readonly VizelCommand[],
  options: VizelBlockMenuFromCommandsOptions
): readonly VizelCommandSpec[] {
  return commands
    .filter((command) => command.surfaces.blockMenu !== undefined)
    .toSorted(
      (a, b) => (a.surfaces.blockMenu?.priority ?? 0) - (b.surfaces.blockMenu?.priority ?? 0)
    )
    .map((command) => deriveVizelCommandSpec(command, options.editor, options.locale));
}
