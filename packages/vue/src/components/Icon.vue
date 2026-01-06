<script setup lang="ts">
import { Icon as IconifyIcon } from "@iconify/vue";
import { defaultIconIds, type IconName } from "@vizel/core";
import { computed } from "vue";
import { type CustomIconMap, useIconContext } from "./IconContext";

export interface IconProps {
  /**
   * The semantic icon name from Vizel's icon system.
   */
  name: IconName;
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
}

const props = defineProps<IconProps>();
const { customIcons: contextIcons } = useIconContext();

const iconId = computed(
  () => props.customIcons?.[props.name] ?? contextIcons?.[props.name] ?? defaultIconIds[props.name]
);
</script>

<template>
  <IconifyIcon
    :icon="iconId"
    :style="{ pointerEvents: 'none' }"
    v-bind="{
      ...(props.width !== undefined && { width: props.width }),
      ...(props.height !== undefined && { height: props.height }),
      ...(props.color !== undefined && { color: props.color }),
    }"
  />
</template>
