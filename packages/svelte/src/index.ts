/**
 * @vizel/svelte
 *
 * Svelte 5 components and runes for the Vizel visual editor.
 */

// Import Tiptap extension types for ChainedCommands augmentation
import "./tiptap-extensions.ts";

// Initialize icon renderer (auto-registers with core)
import "./iconRenderer.ts";

// Components
export {
  getVizelContext,
  getVizelContextSafe,
  getVizelIconContext,
  setVizelIcons,
  // Vizel all-in-one
  Vizel,
  // BubbleMenu
  VizelBubbleMenu,
  VizelBubbleMenuButton,
  type VizelBubbleMenuButtonProps,
  VizelBubbleMenuColorPicker,
  type VizelBubbleMenuColorPickerProps,
  VizelBubbleMenuDefault,
  type VizelBubbleMenuDefaultProps,
  VizelBubbleMenuDivider,
  type VizelBubbleMenuDividerProps,
  type VizelBubbleMenuProps,
  // ColorPicker
  VizelColorPicker,
  type VizelColorPickerProps,
  // Editor components
  VizelEditor,
  type VizelEditorProps,
  // EmbedView
  VizelEmbedView,
  type VizelEmbedViewProps,
  type VizelExposed,
  // FindReplace
  VizelFindReplace,
  type VizelFindReplaceProps,
  // Icon
  VizelIcon,
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
  VizelThemeProvider,
  type VizelThemeProviderProps,
  // Toolbar
  VizelToolbar,
  VizelToolbarButton,
  type VizelToolbarButtonProps,
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
  type CreateVizelMarkdownOptions,
  type CreateVizelMarkdownResult,
  createVizelAutoSave,
  createVizelEditor,
  createVizelEditorState,
  createVizelMarkdown,
  createVizelSlashMenuRenderer,
  createVizelState,
  getVizelTheme,
  getVizelThemeSafe,
  type VizelSlashMenuRendererOptions,
} from "./runes/index.ts";
