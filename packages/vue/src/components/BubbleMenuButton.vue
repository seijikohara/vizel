<script setup lang="ts">
defineProps<{
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
  class?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'vizel-bubble-menu-button',
      { 'is-active': isActive },
      $props.class,
    ]"
    :title="title"
    :data-active="isActive || undefined"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
