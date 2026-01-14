import { Icon as IconifyIcon } from "@iconify/react";
import type { CustomIconMap } from "@vizel/core";
import { type VizelIconName, vizelDefaultIconIds } from "@vizel/core";
import type { ComponentProps } from "react";
import { useVizelIconContext } from "./VizelIconContext.tsx";

export interface VizelIconProps extends Omit<ComponentProps<typeof IconifyIcon>, "icon"> {
  /**
   * The semantic icon name from Vizel's icon system.
   */
  name: VizelIconName;
  /**
   * Custom icon mappings to override default Iconify icon IDs.
   * If provided, will take precedence over context icons.
   */
  customIcons?: CustomIconMap;
}

/**
 * Icon component that renders Iconify icons based on semantic icon names.
 * Uses Lucide icons by default, but can be customized via:
 * 1. customIcons prop (highest priority)
 * 2. VizelIconProvider context
 * 3. Default Lucide icons (fallback)
 *
 * @example
 * ```tsx
 * // Using default Lucide icons
 * <VizelIcon name="heading1" />
 *
 * // With custom icon override (prop takes precedence)
 * <VizelIcon name="heading1" customIcons={{ heading1: "mdi:format-header-1" }} />
 *
 * // With VizelIconProvider context
 * <VizelIconProvider icons={{ heading1: "ph:text-h-one" }}>
 *   <VizelIcon name="heading1" /> {/* Uses Phosphor icon *\/}
 * </VizelIconProvider>
 *
 * // With size and color
 * <VizelIcon name="check" width={24} height={24} color="green" />
 * ```
 */
export function VizelIcon({ name, customIcons, style, ...props }: VizelIconProps) {
  const { customIcons: contextIcons } = useVizelIconContext();
  const iconId = customIcons?.[name] ?? contextIcons?.[name] ?? vizelDefaultIconIds[name];
  return <IconifyIcon icon={iconId} style={{ pointerEvents: "none", ...style }} {...props} />;
}
