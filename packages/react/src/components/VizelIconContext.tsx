import type { CustomIconMap, VizelIconContextValue } from "@vizel/core";
import { createContext, type ReactNode, useContext } from "react";

const VizelIconContext = createContext<VizelIconContextValue>({});

export interface VizelIconProviderProps {
  /**
   * Custom icon mappings to override default Lucide icons.
   * Any icon not specified will fall back to the default Lucide icon.
   *
   * @example
   * ```tsx
   * // Use Material Design Icons for some icons
   * <VizelIconProvider icons={{ bold: "mdi:format-bold", italic: "mdi:format-italic" }}>
   *   <App />
   * </VizelIconProvider>
   *
   * // Use Heroicons
   * <VizelIconProvider icons={{ check: "heroicons:check", warning: "heroicons:exclamation-triangle" }}>
   *   <App />
   * </VizelIconProvider>
   * ```
   */
  icons?: CustomIconMap;
  children: ReactNode;
}

/**
 * Provider component for customizing icons throughout the application.
 * Wrap your application or editor with this provider to use custom icon sets.
 *
 * @example
 * ```tsx
 * import { VizelIconProvider } from "@vizel/react";
 *
 * // Use Phosphor icons
 * const phosphorIcons = {
 *   heading1: "ph:text-h-one",
 *   heading2: "ph:text-h-two",
 *   bold: "ph:text-b-bold",
 *   italic: "ph:text-italic",
 *   // ... more icons
 * };
 *
 * function App() {
 *   return (
 *     <VizelIconProvider icons={phosphorIcons}>
 *       <VizelEditor />
 *     </VizelIconProvider>
 *   );
 * }
 * ```
 */
export function VizelIconProvider({ icons, children }: VizelIconProviderProps) {
  return (
    <VizelIconContext.Provider value={{ customIcons: icons }}>{children}</VizelIconContext.Provider>
  );
}

/**
 * Hook to access custom icon mappings from VizelIconProvider.
 * Returns undefined if no VizelIconProvider is present (falls back to defaults).
 */
export function useVizelIconContext(): VizelIconContextValue {
  return useContext(VizelIconContext);
}
