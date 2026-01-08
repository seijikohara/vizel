<script setup lang="ts">
import { Icon as IconifyIcon } from "@iconify/vue";
import { type VizelIconName, vizelDefaultIconIds } from "@vizel/core";
import { computed } from "vue";
import { type CustomIconMap, useVizelIconContext } from "./VizelIconContext";

export interface VizelIconProps {
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
}

const props = defineProps<VizelIconProps>();
const { customIcons: contextIcons } = useVizelIconContext();

const iconId = computed(
  () =>
    props.customIcons?.[props.name] ?? contextIcons?.[props.name] ?? vizelDefaultIconIds[props.name]
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
