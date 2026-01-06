import type { IconName } from "@vizel/core";
import { createContext, type ReactNode, useContext } from "react";

/**
 * Custom icon mappings to override default Iconify icon IDs.
 * Keys are semantic icon names, values are Iconify icon IDs.
 *
 * @example
 * ```tsx
 * const customIcons = {
 *   heading1: "mdi:format-header-1",
 *   bold: "mdi:format-bold",
 *   // Use any Iconify icon set: Material Design, Heroicons, Phosphor, etc.
 * };
 * ```
 */
export type CustomIconMap = Partial<Record<IconName, string>>;

export interface IconContextValue {
  /**
   * Custom icon mappings that override default Lucide icons.
   */
  customIcons?: CustomIconMap | undefined;
}

const IconContext = createContext<IconContextValue>({});

export interface IconProviderProps {
  /**
   * Custom icon mappings to override default Lucide icons.
   * Any icon not specified will fall back to the default Lucide icon.
   *
   * @example
   * ```tsx
   * // Use Material Design Icons for some icons
   * <IconProvider icons={{ bold: "mdi:format-bold", italic: "mdi:format-italic" }}>
   *   <App />
   * </IconProvider>
   *
   * // Use Heroicons
   * <IconProvider icons={{ check: "heroicons:check", warning: "heroicons:exclamation-triangle" }}>
   *   <App />
   * </IconProvider>
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
 * import { IconProvider } from "@vizel/react";
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
 *     <IconProvider icons={phosphorIcons}>
 *       <VizelEditor />
 *     </IconProvider>
 *   );
 * }
 * ```
 */
export function IconProvider({ icons, children }: IconProviderProps) {
  return <IconContext.Provider value={{ customIcons: icons }}>{children}</IconContext.Provider>;
}

/**
 * Hook to access custom icon mappings from IconProvider.
 * Returns undefined if no IconProvider is present (falls back to defaults).
 */
export function useIconContext(): IconContextValue {
  return useContext(IconContext);
}
