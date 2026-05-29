import type { VizelIconContextValue } from "@vizel/core";
import { getContext, setContext } from "svelte";

export const VIZEL_ICON_CONTEXT_KEY = Symbol("vizel-icon-context");

/**
 * Publish custom icon mappings to descendants through Svelte context.
 *
 * Call this typed wrapper instead of `setContext(VIZEL_ICON_CONTEXT_KEY,
 * ...)` so the key and the `VizelIconContextValue` value type stay paired.
 * {@link getVizelIconContext} reads the same context. The wrapper mirrors
 * the editor context's `setVizelContext` idiom (ADR-0004).
 *
 * @param value - Reactive icon-context value whose `customIcons` getter
 *   returns the active icon overrides.
 * @returns The value, so a caller can publish and reuse it in one
 *   expression.
 */
export function setVizelIconContext(value: VizelIconContextValue): VizelIconContextValue {
  return setContext(VIZEL_ICON_CONTEXT_KEY, value);
}

/**
 * Get custom icon mappings from parent context.
 * Returns an empty object if no context is set.
 */
export function getVizelIconContext(): VizelIconContextValue {
  return getContext<VizelIconContextValue>(VIZEL_ICON_CONTEXT_KEY) ?? {};
}
