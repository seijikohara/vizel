/**
 * @vizel/react
 *
 * React components and hooks for the Vizel visual editor.
 */

// Components
export {
  EditorRoot,
  EditorContent,
  EditorProvider,
  useEditorContext,
  useEditorContextSafe,
  type EditorRootProps,
  type EditorContentProps,
  type EditorProviderProps,
} from "./components/index.ts";

// Hooks
export { useVizelEditor, type UseVizelEditorOptions } from "./hooks/index.ts";

// Re-export core types for convenience
export type {
  VizelEditorOptions,
  VizelEditorState,
  Editor,
  JSONContent,
} from "@vizel/core";

// Re-export core extensions
export { createVizelExtensions, type VizelStarterKitOptions } from "@vizel/core";
