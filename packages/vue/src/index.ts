/**
 * @vizel/vue
 *
 * Vue 3 components and composables for the Vizel visual editor.
 */

// Initialize icon renderer (auto-registers with core)
import "./iconRenderer.ts";

// Components
export {
  type CustomIconMap,
  provideVizelIconContext,
  useVizelContext,
  useVizelContextSafe,
  useVizelIconContext,
  // Vizel all-in-one
  Vizel,
  // ColorPicker
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
  VizelIconContextKey,
  type VizelIconContextValue,
  type VizelIconProps,
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
  VizelThemeContextKey,
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

// Composables
export {
  createVizelSlashMenuRenderer,
  type UseVizelAutoSaveResult,
  type UseVizelEditorOptions,
  useVizelAutoSave,
  useVizelEditor,
  useVizelState,
  useVizelTheme,
  useVizelThemeSafe,
  type VizelSlashMenuRendererOptions,
} from "./composables/index.ts";
