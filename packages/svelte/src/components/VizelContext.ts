import { type Editor, VizelError } from "@vizel/core";
import { getContext } from "svelte";

export const VIZEL_CONTEXT_KEY = Symbol("vizel-editor");

/**
 * Reactive accessor object returned by {@link getVizelContext} and
 * {@link getVizelContextSafe}.
 *
 * Reading `.current` from inside a reactive context (`$derived`, `$effect`,
 * a template expression) registers the read as a dependency, so the
 * consumer re-evaluates whenever the provided editor changes. Mirrors the
 * Svelte 5 idiom for exposing runes through plain objects.
 */
export interface VizelContextAccessor {
  /** The currently provided editor instance, or `null` when not ready. */
  readonly current: Editor | null;
}

/**
 * Get the editor instance accessor from VizelProvider context.
 *
 * @throws Error if used outside of VizelProvider
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { getVizelContext } from '@vizel/svelte';
 *
 * const context = getVizelContext();
 * </script>
 *
 * <button onclick={() => context.current?.chain().focus().toggleBold().run()}>
 *   Bold
 * </button>
 * ```
 */
export function getVizelContext(): VizelContextAccessor {
  const accessor = getContext<VizelContextAccessor | undefined>(VIZEL_CONTEXT_KEY);
  if (!accessor) {
    throw new VizelError(
      "MISSING_CONTEXT",
      "getVizelContext must be used within <VizelProvider> or <Vizel>. " +
        "Wrap the consumer in <VizelProvider editor={editor.current}>...</VizelProvider>."
    );
  }
  return accessor;
}

/**
 * Get the editor instance accessor from context.
 *
 * Returns `null` when called outside of `VizelProvider` (does not
 * throw). Mirrors {@link getVizelContext} but is non-throwing so optional
 * consumers (e.g. components that work both inside and outside a provider)
 * can fall back gracefully.
 *
 * The `null` sentinel matches the React / Vue equivalents
 * (`useVizelContextSafe`) — every framework returns `null` when no
 * provider is present.
 */
export function getVizelContextSafe(): VizelContextAccessor | null {
  return getContext<VizelContextAccessor | undefined>(VIZEL_CONTEXT_KEY) ?? null;
}
