import type { Editor } from "@vizel/core";
import { type ComputedRef, computed, type InjectionKey, inject } from "vue";

export const VIZEL_CONTEXT_KEY: InjectionKey<() => Editor | null> = Symbol("vizel-editor");

/**
 * Composable to access the editor instance from VizelProvider context.
 * Returns a computed ref that reactively updates when the editor changes.
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
export function useVizelContext(): ComputedRef<Editor | null> {
  const getEditor = inject(VIZEL_CONTEXT_KEY);
  if (!getEditor) {
    throw new Error("useVizelContext must be used within a VizelProvider");
  }
  return computed(() => getEditor());
}

/**
 * Composable to access the editor instance from VizelProvider context.
 * Returns `null` if used outside a VizelProvider (does NOT throw).
 *
 * Both `useVizelContext` and `useVizelContextSafe` return a
 * `ComputedRef<Editor | null>` so destructuring / template usage is
 * symmetric; the only difference is whether the absence of a provider
 * is treated as fatal.
 *
 * @returns A computed ref of the editor, or `null` when no provider is present.
 */
export function useVizelContextSafe(): ComputedRef<Editor | null> | null {
  // Provide null as default to suppress Vue warning when used outside VizelProvider
  const getEditor = inject(VIZEL_CONTEXT_KEY, null);
  if (!getEditor) return null;
  return computed(() => getEditor());
}
