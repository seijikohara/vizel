import type { Editor } from "@vizel/core";
import { type InjectionKey, inject, type ShallowRef } from "vue";

/**
 * Injection key for the editor instance provided by `VizelProvider`.
 *
 * The injected value is a `ShallowRef<Editor | null>` rather than a getter or
 * a wrapping object. This lets `useVizelContext()` return the ref itself
 * (matching the spec's Option B return-type table: Vue exposes context as a
 * `ShallowRef<Editor | null>`, mirroring the `ShallowRef` returned by
 * `useVizelEditor`).
 */
export const VIZEL_CONTEXT_KEY: InjectionKey<ShallowRef<Editor | null>> = Symbol("vizel-editor");

/**
 * Composable to access the editor instance from VizelProvider context.
 *
 * Returns the `ShallowRef<Editor | null>` provided by `VizelProvider` so that
 * templates can read `editor.value` and effects can track the reactive
 * source. Mirrors the shape returned by `useVizelEditor`.
 *
 * @throws Error if used outside of VizelProvider
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useVizelContext } from '@vizel/vue';
 *
 * const editor = useVizelContext();
 * </script>
 *
 * <template>
 *   <button @click="editor?.chain().focus().toggleBold().run()">
 *     Bold
 *   </button>
 * </template>
 * ```
 */
export function useVizelContext(): ShallowRef<Editor | null> {
  const editorRef = inject(VIZEL_CONTEXT_KEY);
  if (!editorRef) {
    throw new Error("useVizelContext must be used within a VizelProvider");
  }
  return editorRef;
}

/**
 * Composable to access the editor instance from VizelProvider context.
 * Returns `null` if used outside a VizelProvider (does NOT throw).
 *
 * Both `useVizelContext` and `useVizelContextSafe` return the underlying
 * `ShallowRef<Editor | null>` so destructuring / template usage is
 * symmetric; the only difference is whether the absence of a provider
 * is treated as fatal.
 *
 * @returns The injected editor ref, or `null` when no provider is present.
 */
export function useVizelContextSafe(): ShallowRef<Editor | null> | null {
  // Provide null as default to suppress Vue warning when used outside VizelProvider
  return inject(VIZEL_CONTEXT_KEY, null);
}
