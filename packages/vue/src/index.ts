/**
 * @vizel/vue
 *
 * Vue 3 components and composables for the Vizel visual editor.
 */

// Components
export {
  EditorRoot,
  EditorContent,
  useEditorContext,
  useEditorContextSafe,
  EDITOR_INJECTION_KEY,
} from "./components/index.ts";

// Composables
export { useVizelEditor, type UseVizelEditorOptions } from "./composables/index.ts";

// Re-export core types for convenience
export type {
  VizelEditorOptions,
  VizelEditorState,
  Editor,
  JSONContent,
} from "@vizel/core";

// Re-export core extensions
export { createVizelExtensions, type VizelStarterKitOptions } from "@vizel/core";
