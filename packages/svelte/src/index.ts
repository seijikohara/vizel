/**
 * @vizel/svelte
 *
 * Svelte 5 components and runes for the Vizel visual editor.
 */

// Import Tiptap extension types for ChainedCommands augmentation
import "./tiptap-extensions.js";

// Initialize icon renderer (inline to prevent tree-shaking in Vite library builds)
import { initVizelIconRenderer } from "@vizel/core";

initVizelIconRenderer();

// Re-export the full @vizel/core public API so consumers can install only
// the framework package and import every shared symbol from one place.
// biome-ignore lint/performance/noReExportAll: mirror the full Core surface so named exports never drift whenever Core adds a symbol.
export * from "@vizel/core";

// Explicit re-export of the shallow-equality helpers from Core. The
// wildcard above already forwards them; this named declaration documents
// the manifest-mandated symbols so the feature manifest (verified by
// `pnpm check:feature-parity` / `scripts/check-feature-parity.ts`)
// resolves them to a single source across frameworks.
export { shallowEqualArray, shallowEqualObject } from "@vizel/core";

// Components
export {
  getVizelContext,
  getVizelContextSafe,
  getVizelIconContext,
  setVizelContext,
  setVizelIconContext,
  // Vizel all-in-one
  Vizel,
  // BlockMenu
  VizelBlockMenu,
  type VizelBlockMenuProps,
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
  type VizelContextAccessor,
  // Editor components
  VizelEditor,
  type VizelEditorProps,
  type VizelEditorRef,
  // EmbedView
  VizelEmbedView,
  type VizelEmbedViewProps,
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
  // MentionMenu
  VizelMentionMenu,
  type VizelMentionMenuProps,
  type VizelMentionMenuRef,
  // NodeSelector
  VizelNodeSelector,
  type VizelNodeSelectorProps,
  // Outline
  VizelOutline,
  type VizelOutlineProps,
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
  VizelToolbarDropdown,
  type VizelToolbarDropdownProps,
  VizelToolbarOverflow,
  type VizelToolbarOverflowProps,
  type VizelToolbarProps,
} from "./components/index.js";

// Runes (Svelte 5 reactive state)
export {
  type CreateVizelAutoSaveResult,
  type CreateVizelCollaborationResult,
  type CreateVizelCommentResult,
  type CreateVizelEditorOptions,
  type CreateVizelEditorStateOptions,
  type CreateVizelMarkdownOptions,
  type CreateVizelMarkdownResult,
  type CreateVizelVersionHistoryResult,
  createVizelAutoSave,
  createVizelCollaboration,
  createVizelComment,
  createVizelEditor,
  createVizelEditorState,
  createVizelMarkdown,
  createVizelMentionMenuRenderer,
  createVizelSlashMenuRenderer,
  createVizelState,
  createVizelVersionHistory,
  getVizelTheme,
  getVizelThemeSafe,
  type VizelSuggestionRendererOptions,
} from "./runes/index.js";
