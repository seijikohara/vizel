import type { VizelIconContextValue } from "@vizel/core";
import { getContext } from "svelte";

export const VIZEL_ICON_CONTEXT_KEY = Symbol("vizel-icon-context");

/**
 * Get custom icon mappings from parent context.
 * Returns an empty object if no context is set.
 */
export function getVizelIconContext(): VizelIconContextValue {
  return getContext<VizelIconContextValue>(VIZEL_ICON_CONTEXT_KEY) ?? {};
}
