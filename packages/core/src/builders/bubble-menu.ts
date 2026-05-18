import type { Editor } from "@tiptap/core";
import { deriveVizelCommandSpec } from "../commands/derive.ts";
import type { VizelCommand } from "../commands/types.ts";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelCommandSpec } from "./types.ts";

/**
 * Options accepted by {@link buildVizelBubbleMenuSpec}.
 */
export interface VizelBubbleMenuSpecOptions {
  /** Editor instance used for `canRun` / `isActive` resolution. */
  readonly editor: Editor;
  /** Locale supplying button labels and tooltips. */
  readonly locale: VizelLocale;
}

/**
 * Build the bubble-menu spec from a {@link VizelCommand} array.
 *
 * Filters by `surfaces.bubbleMenu`, applies each command's optional
 * `showWhen` predicate against the editor, sorts by priority
 * ascending, and projects each command into a Section 2
 * {@link VizelCommandSpec}.
 */
export function buildVizelBubbleMenuSpec(
  commands: readonly VizelCommand[],
  options: VizelBubbleMenuSpecOptions
): readonly VizelCommandSpec[] {
  return commands
    .filter((command) => {
      const surface = command.surfaces.bubbleMenu;
      if (!surface) return false;
      return surface.showWhen ? surface.showWhen(options.editor) : true;
    })
    .slice()
    .sort((a, b) => (a.surfaces.bubbleMenu?.priority ?? 0) - (b.surfaces.bubbleMenu?.priority ?? 0))
    .map((command) => deriveVizelCommandSpec(command, options.editor, options.locale));
}
