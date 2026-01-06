import { Icon as IconifyIcon } from "@iconify/react";
import { defaultIconIds, type IconName } from "@vizel/core";
import type { ComponentProps } from "react";
import { type CustomIconMap, useIconContext } from "./IconContext";

export interface IconProps extends Omit<ComponentProps<typeof IconifyIcon>, "icon"> {
  /**
   * The semantic icon name from Vizel's icon system.
   */
  name: IconName;
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
 * 2. IconProvider context
 * 3. Default Lucide icons (fallback)
 *
 * @example
 * ```tsx
 * // Using default Lucide icons
 * <Icon name="heading1" />
 *
 * // With custom icon override (prop takes precedence)
 * <Icon name="heading1" customIcons={{ heading1: "mdi:format-header-1" }} />
 *
 * // With IconProvider context
 * <IconProvider icons={{ heading1: "ph:text-h-one" }}>
 *   <Icon name="heading1" /> {/* Uses Phosphor icon *\/}
 * </IconProvider>
 *
 * // With size and color
 * <Icon name="check" width={24} height={24} color="green" />
 * ```
 */
export function Icon({ name, customIcons, style, ...props }: IconProps) {
  const { customIcons: contextIcons } = useIconContext();
  const iconId = customIcons?.[name] ?? contextIcons?.[name] ?? defaultIconIds[name];
  return <IconifyIcon icon={iconId} style={{ pointerEvents: "none", ...style }} {...props} />;
}
