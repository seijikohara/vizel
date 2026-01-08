// ============================================================================
// Vizel Toolbar components (formerly BubbleMenu)
// ============================================================================

// ============================================================================
// Vizel all-in-one component
// ============================================================================
export { default as Vizel, type VizelProps } from "./Vizel.svelte";
// ============================================================================
// Vizel ColorPicker component
// ============================================================================
export {
  type ColorPickerProps as VizelColorPickerProps,
  default as VizelColorPicker,
} from "./VizelColorPicker.svelte";
export { getVizelContext, getVizelContextSafe } from "./VizelContext.ts";
// ============================================================================
// Vizel Editor components
// ============================================================================
export {
  default as VizelEditor,
  type EditorContentProps as VizelEditorProps,
} from "./VizelEditor.svelte";
// ============================================================================
// Vizel EmbedView component
// ============================================================================
export {
  default as VizelEmbedView,
  type EmbedViewProps as VizelEmbedViewProps,
} from "./VizelEmbedView.svelte";
// ============================================================================
// Vizel Icon component
// ============================================================================
export { default as VizelIcon } from "./VizelIcon.svelte";
export {
  type CustomIconMap,
  getVizelIconContext,
  setVizelIconContext,
  type VizelIconContextValue,
} from "./VizelIconContext.ts";
export {
  type BubbleMenuLinkEditorProps as VizelLinkEditorProps,
  default as VizelLinkEditor,
} from "./VizelLinkEditor.svelte";
// ============================================================================
// Vizel NodeSelector component
// ============================================================================
export {
  default as VizelNodeSelector,
  type NodeSelectorProps as VizelNodeSelectorProps,
} from "./VizelNodeSelector.svelte";
// ============================================================================
// Vizel Portal component
// ============================================================================
export {
  default as VizelPortal,
  type PortalProps as VizelPortalProps,
} from "./VizelPortal.svelte";
export {
  default as VizelProvider,
  type EditorRootProps as VizelProviderProps,
} from "./VizelProvider.svelte";
// ============================================================================
// Vizel SaveIndicator component
// ============================================================================
export {
  default as VizelSaveIndicator,
  type SaveIndicatorProps as VizelSaveIndicatorProps,
} from "./VizelSaveIndicator.svelte";
// ============================================================================
// Vizel SlashMenu components
// ============================================================================
export {
  default as VizelSlashMenu,
  type SlashMenuProps as VizelSlashMenuProps,
  type SlashMenuRef as VizelSlashMenuRef,
} from "./VizelSlashMenu.svelte";
export {
  default as VizelSlashMenuEmpty,
  type SlashMenuEmptyProps as VizelSlashMenuEmptyProps,
} from "./VizelSlashMenuEmpty.svelte";
export {
  default as VizelSlashMenuItem,
  type SlashMenuItemProps as VizelSlashMenuItemProps,
} from "./VizelSlashMenuItem.svelte";
// ============================================================================
// Vizel ThemeProvider component
// ============================================================================
export {
  default as VizelThemeProvider,
  VIZEL_THEME_CONTEXT_KEY,
} from "./VizelThemeProvider.svelte";
export {
  type BubbleMenuProps as VizelToolbarProps,
  default as VizelToolbar,
} from "./VizelToolbar.svelte";
export {
  type BubbleMenuButtonProps as VizelToolbarButtonProps,
  default as VizelToolbarButton,
} from "./VizelToolbarButton.svelte";
export {
  type BubbleMenuColorPickerProps as VizelToolbarColorPickerProps,
  default as VizelToolbarColorPicker,
} from "./VizelToolbarColorPicker.svelte";
export {
  type BubbleMenuToolbarProps as VizelToolbarDefaultProps,
  default as VizelToolbarDefault,
} from "./VizelToolbarDefault.svelte";
export {
  type BubbleMenuDividerProps as VizelToolbarDividerProps,
  default as VizelToolbarDivider,
} from "./VizelToolbarDivider.svelte";
