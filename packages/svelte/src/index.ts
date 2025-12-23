/**
 * @vizel/svelte
 *
 * Svelte 5 components for the Vizel visual editor.
 */

// Components
export {
  EditorRoot,
  EditorContent,
  getEditorContext,
  getEditorContextSafe,
  EDITOR_CONTEXT_KEY,
} from "./components/index.ts";

// Editor factory
export {
  createVizelEditor,
  type CreateVizelEditorOptions,
} from "./createVizelEditor.ts";

// Re-export core types for convenience
export type {
  VizelEditorOptions,
  VizelEditorState,
  Editor,
  JSONContent,
} from "@vizel/core";

// Re-export core extensions
export { createVizelExtensions, type VizelStarterKitOptions } from "@vizel/core";
