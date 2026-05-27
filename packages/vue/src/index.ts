/**
 * @vizel/vue
 *
 * Vue 3 components and composables for the Vizel visual editor.
 */

// Import Tiptap extension types for ChainedCommands augmentation
import "./tiptap-extensions.ts";

// Initialize icon renderer (inline to prevent tree-shaking in Vite library builds)
import { initVizelIconRenderer } from "@vizel/core";

initVizelIconRenderer();

// Re-export the full @vizel/core public API so consumers can install only
// the framework package and import every shared symbol from one place.
// biome-ignore lint/performance/noReExportAll: intentional re-export mirror per Section 6 of the v2.0.0 spec; named-only would diverge whenever Core adds a symbol.
export * from "@vizel/core";
// First-party `shallowRef`-backed reactivity primitive.
// ADR-0009 mandates that every adapter implements editor reactivity
// natively; Vue's adapter holds the implementation in `_reactivity.ts`
// and re-exports the consumer-facing surface here. The shallow-equality
// helpers re-export from `@vizel/core` so the cross-framework parity
// check can resolve them back to a single source.
export { shallowEqualArray, shallowEqualObject, useVizelEditorState } from "./_reactivity.ts";

// Components
export {
  provideVizelIcons,
  useVizelContext,
  useVizelContextSafe,
  useVizelIconContext,
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
} from "./components/index.ts";

// Composables
export {
  createVizelMentionMenuRenderer,
  createVizelSlashMenuRenderer,
  type UseVizelAutoSaveResult,
  type UseVizelCollaborationResult,
  type UseVizelCommentResult,
  type UseVizelEditorOptions,
  type UseVizelMarkdownOptions,
  type UseVizelMarkdownResult,
  type UseVizelVersionHistoryResult,
  useVizelAutoSave,
  useVizelCollaboration,
  useVizelComment,
  useVizelEditor,
  useVizelMarkdown,
  useVizelState,
  useVizelTheme,
  useVizelThemeSafe,
  useVizelVersionHistory,
  type VizelSuggestionRendererOptions,
} from "./composables/index.ts";
