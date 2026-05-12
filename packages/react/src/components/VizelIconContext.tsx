import type { VizelIconContextValue } from "@vizel/core";
import { createContext, useContext } from "react";

export const VizelIconContext = createContext<VizelIconContextValue>({});

/**
 * Hook to access custom icon mappings from VizelIconProvider.
 * Returns an empty value if no VizelIconProvider is present (falls back to
 * defaults).
 */
export function useVizelIconContext(): VizelIconContextValue {
  return useContext(VizelIconContext);
}
