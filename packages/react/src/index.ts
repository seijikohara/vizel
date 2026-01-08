/**
 * @vizel/react
 *
 * React components and hooks for the Vizel visual editor.
 */

// Initialize icon renderer (auto-registers with core)
import "./iconRenderer.ts";

// Components
export {
  type CustomIconMap,
  useVizelContext,
  useVizelContextSafe,
  useVizelIconContext,
  useVizelTheme,
  useVizelThemeSafe,
  // Vizel all-in-one
  Vizel,
  // Color Picker
  VizelColorPicker,
  type VizelColorPickerProps,
  // Editor components
  VizelEditor,
  type VizelEditorProps,
  // EmbedView
  VizelEmbedView,
  type VizelEmbedViewProps,
  // Icon
  VizelIcon,
  type VizelIconContextValue,
  type VizelIconProps,
  VizelIconProvider,
  type VizelIconProviderProps,
  VizelLinkEditor,
  type VizelLinkEditorProps,
  // NodeSelector
  VizelNodeSelector,
  type VizelNodeSelectorProps,
  // Portal
  VizelPortal,
  type VizelPortalProps,
  type VizelProps,
  VizelProvider,
  type VizelProviderProps,
  type VizelRef,
  // SaveIndicator
  VizelSaveIndicator,
  type VizelSaveIndicatorProps,
  // SlashMenu
  VizelSlashMenu,
  VizelSlashMenuEmpty,
  type VizelSlashMenuEmptyProps,
  VizelSlashMenuItem,
  type VizelSlashMenuItemProps,
  type VizelSlashMenuProps,
  type VizelSlashMenuRef,
  // ThemeProvider
  VizelThemeProvider,
  type VizelThemeProviderProps,
  // Vizel Toolbar
  VizelToolbar,
  VizelToolbarButton,
  type VizelToolbarButtonProps,
  VizelToolbarColorPicker,
  type VizelToolbarColorPickerProps,
  VizelToolbarDefault,
  type VizelToolbarDefaultProps,
  VizelToolbarDivider,
  type VizelToolbarDividerProps,
  type VizelToolbarProps,
} from "./components/index.ts";

// Hooks
export {
  createVizelSlashMenuRenderer,
  type UseVizelAutoSaveResult,
  type UseVizelEditorOptions,
  useVizelAutoSave,
  useVizelEditor,
  useVizelState,
  type VizelSlashMenuRendererOptions,
} from "./hooks/index.ts";
