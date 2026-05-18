import type { VizelCommand } from "../types.ts";
import { vizelBlockCommands } from "./block.ts";
import { vizelFormatCommands } from "./format.ts";
import { vizelInsertCommands } from "./insert.ts";

export { vizelBlockCommands } from "./block.ts";
export { vizelFormatCommands } from "./format.ts";
export { vizelInsertCommands } from "./insert.ts";

/**
 * Concatenation of the three built-in command registries.
 *
 * Surface builders consume `vizelDefaultCommands` to populate slash
 * menus, toolbars, bubble menus, and shortcuts in a single pass. Pass
 * your own array to override or extend the defaults.
 */
export const vizelDefaultCommands: readonly VizelCommand[] = [
  ...vizelFormatCommands,
  ...vizelBlockCommands,
  ...vizelInsertCommands,
];
