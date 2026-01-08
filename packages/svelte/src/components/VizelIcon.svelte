<script lang="ts">
import type { IconifyIconProps } from "@iconify/svelte";
import Icon from "@iconify/svelte";
import { type VizelIconName, vizelDefaultIconIds } from "@vizel/core";
import { type CustomIconMap, getVizelIconContext } from "./VizelIconContext";

interface Props {
  /**
   * The semantic icon name from Vizel's icon system.
   */
  name: VizelIconName;
  /**
   * Custom icon mappings to override default Iconify icon IDs.
   * If provided, will take precedence over context icons.
   */
  customIcons?: CustomIconMap;
  /**
   * Icon width in pixels or CSS value.
   */
  width?: string | number;
  /**
   * Icon height in pixels or CSS value.
   */
  height?: string | number;
  /**
   * Icon color.
   */
  color?: string;
  /**
   * Additional CSS class.
   */
  class?: string;
}

const { name, customIcons, width, height, color, class: className }: Props = $props();
const { customIcons: contextIcons } = getVizelIconContext();

const iconId = $derived(customIcons?.[name] ?? contextIcons?.[name] ?? vizelDefaultIconIds[name]);

// Build props object excluding undefined values to satisfy exactOptionalPropertyTypes
const iconProps = $derived.by(() => {
  const props: IconifyIconProps = { icon: iconId };
  if (width !== undefined) props.width = width;
  if (height !== undefined) props.height = height;
  if (color !== undefined) props.color = color;
  return props;
});
</script>

<Icon {...iconProps} class={className} style="pointer-events: none;" />
