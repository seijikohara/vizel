import type { CustomIconMap } from "@vizel/core";
import { type ReactNode, useMemo } from "react";
import { VizelIconContext } from "./VizelIconContext.tsx";

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
  // Memoize the context value so descendants only re-render when `icons` changes
  // rather than on every parent render.
  const value = useMemo(() => ({ customIcons: icons }), [icons]);
  return <VizelIconContext.Provider value={value}>{children}</VizelIconContext.Provider>;
}
