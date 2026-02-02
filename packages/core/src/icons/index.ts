/**
 * Icon system for Vizel editor.
 *
 * Provides semantic icon names and default Iconify icon IDs.
 * Framework packages implement the actual rendering using Iconify components.
 */

export {
  type CustomIconMap,
  getVizelIconId,
  initVizelIconRenderer,
  renderVizelIcon,
  renderVizelIconSvg,
  setVizelIconRenderer,
  type VizelBubbleMenuIconName,
  type VizelIconContextValue,
  type VizelIconName,
  type VizelIconRenderer,
  type VizelIconRendererOptions,
  type VizelIconRendererWithOptions,
  type VizelInternalIconName,
  type VizelNodeTypeIconName,
  type VizelSlashCommandIconName,
  type VizelTableIconName,
  type VizelToolbarIconName,
  type VizelUIIconName,
  vizelDefaultIconIds,
} from "./types.ts";
