/**
 * @vizel/svelte
 *
 * Svelte 5 components and runes for the Vizel visual editor.
 */

// Initialize icon renderer (auto-registers with core)
import "./iconRenderer.ts";

// Components
export {
  type CustomIconMap,
  getVizelContext,
  getVizelContextSafe,
  getVizelIconContext,
  setVizelIconContext,
  // ThemeProvider
  VIZEL_THEME_CONTEXT_KEY,
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
  type VizelIconContextValue,
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
  VizelThemeProvider,
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

// Runes (Svelte 5 reactive state)
export {
  type CreateVizelAutoSaveResult,
  type CreateVizelEditorOptions,
  createVizelAutoSave,
  createVizelEditor,
  createVizelSlashMenuRenderer,
  createVizelState,
  getVizelTheme,
  getVizelThemeSafe,
  type VizelSlashMenuRendererOptions,
} from "./runes/index.ts";
