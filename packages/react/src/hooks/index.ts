export { createVizelMentionMenuRenderer } from "./createVizelMentionMenuRenderer.ts";
export {
  createVizelSlashMenuRenderer,
  type VizelSuggestionRendererOptions,
} from "./createVizelSlashMenuRenderer.ts";
// Note: `useLatest` is intentionally NOT re-exported. It is an internal
// implementation detail used by `Vizel.tsx` to keep the latest callback
// reachable from the mount-time editor instance — leaking it into the
// public hook surface caused consumers to mis-use it as a generic
// "stable ref" hook. Import the source directly only from within this
// package.
export { type UseVizelAutoSaveResult, useVizelAutoSave } from "./useVizelAutoSave.ts";
export {
  type UseVizelCollaborationResult,
  useVizelCollaboration,
} from "./useVizelCollaboration.ts";
export { type UseVizelCommentResult, useVizelComment } from "./useVizelComment.ts";
export { type UseVizelEditorOptions, useVizelEditor } from "./useVizelEditor.ts";
// `useVizelEditorState` ships from `../_reactivity.ts` per ADR-0009 — the
// selector-style hook that closes the v1 drift. The legacy convenience
// hook that combined `useVizelState` + `getVizelEditorState` is removed;
// consumers select the slice they care about through the v2 selector API.
export {
  type UseVizelMarkdownOptions,
  type UseVizelMarkdownResult,
  useVizelMarkdown,
} from "./useVizelMarkdown.ts";
export { useVizelState } from "./useVizelState.ts";
export { useVizelTheme, useVizelThemeSafe } from "./useVizelTheme.ts";
export {
  type UseVizelVersionHistoryResult,
  useVizelVersionHistory,
} from "./useVizelVersionHistory.ts";
