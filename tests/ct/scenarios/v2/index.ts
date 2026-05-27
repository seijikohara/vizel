/**
 * Barrel for the v2 CT scenario foundation.
 *
 * Re-exports the shared types and every feature scenario. The parity
 * check `tests/ct/parity/check-scenarios.ts` reads this barrel to
 * verify every entry in `VIZEL_FEATURE_MANIFEST` has a scenario.
 */

export { autoSaveScenario } from "./auto-save/index.ts";
export { blockMenuScenario } from "./block-menu/index.ts";
export { bubbleMenuScenario } from "./bubble-menu/index.ts";
export { collaborationScenario } from "./collaboration/index.ts";
export { colorPickerScenario } from "./color-picker/index.ts";
export { commentScenario } from "./comment/index.ts";
export { editorCoreScenario } from "./editor-core/index.ts";
export { embedViewScenario } from "./embed-view/index.ts";
export { findReplaceScenario } from "./find-replace/index.ts";
export { iconScenario } from "./icon/index.ts";
export { linkEditorScenario } from "./link-editor/index.ts";
export { mentionMenuScenario } from "./mention-menu/index.ts";
export { nodeSelectorScenario } from "./node-selector/index.ts";
export { outlineScenario } from "./outline/index.ts";
export { portalScenario } from "./portal/index.ts";
export { providerScenario } from "./provider/index.ts";
export { saveIndicatorScenario } from "./save-indicator/index.ts";
export { slashMenuScenario } from "./slash-menu/index.ts";
export { themeScenario } from "./theme/index.ts";
export { toolbarScenario } from "./toolbar/index.ts";
export { toolbarDropdownScenario } from "./toolbar-dropdown/index.ts";
export { toolbarOverflowScenario } from "./toolbar-overflow/index.ts";
export type {
  VizelScenarioContext,
  VizelScenarioDefinition,
  VizelScenarioMount,
  VizelScenarioMountResult,
} from "./types.ts";
export { versionHistoryScenario } from "./version-history/index.ts";
