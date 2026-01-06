/**
 * Icon system for Vizel editor.
 *
 * Provides semantic icon names and default Iconify icon IDs.
 * Framework packages implement the actual rendering using Iconify components.
 */

export {
  type BubbleMenuIconName,
  defaultIconIds,
  getIconId,
  type IconName,
  type IconRenderer,
  type IconRendererOptions,
  type IconRendererWithOptions,
  type InternalIconName,
  type NodeTypeIconName,
  renderIcon,
  type SlashCommandIconName,
  setIconRenderer,
  type TableIconName,
  type UIIconName,
} from "./types.ts";
