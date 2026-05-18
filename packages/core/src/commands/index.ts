// VizelCommand unified abstraction (Section 9).
export { deriveVizelCommandSpec } from "./derive.ts";
export {
  vizelBlockCommands,
  vizelDefaultCommands,
  vizelFormatCommands,
  vizelInsertCommands,
} from "./registry/index.ts";
export type {
  VizelCommand,
  VizelCommandSurfaceSet,
  VizelShortcut,
} from "./types.ts";
