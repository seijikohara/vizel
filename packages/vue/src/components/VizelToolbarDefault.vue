<script setup lang="ts">
import type { Editor } from "@vizel/core";
import {
  groupVizelToolbarActions,
  type VizelToolbarAction,
  vizelDefaultToolbarActions,
} from "@vizel/core";
import { computed } from "vue";
import { useVizelState } from "../composables/useVizelState.ts";
import VizelIcon from "./VizelIcon.vue";
import VizelToolbarButton from "./VizelToolbarButton.vue";
import VizelToolbarDivider from "./VizelToolbarDivider.vue";

export interface VizelToolbarDefaultProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Custom toolbar actions (defaults to vizelDefaultToolbarActions) */
  actions?: VizelToolbarAction[];
}

const props = withDefaults(defineProps<VizelToolbarDefaultProps>(), {
  actions: () => vizelDefaultToolbarActions,
});

// Subscribe to editor state changes to update active/enabled states
const editorStateVersion = useVizelState(() => props.editor);

const groups = computed(() => {
  void editorStateVersion.value;
  return groupVizelToolbarActions(props.actions);
});
</script>

<template>
  <div :class="['vizel-toolbar-content', $props.class]" data-vizel-toolbar>
    <template v-for="(group, groupIndex) in groups" :key="group[0]?.group ?? groupIndex">
      <VizelToolbarDivider v-if="groupIndex > 0" />
      <VizelToolbarButton
        v-for="action in group"
        :key="action.id"
        :action="action.id"
        :is-active="action.isActive(props.editor)"
        :disabled="!action.isEnabled(props.editor)"
        :title="action.shortcut ? `${action.label} (${action.shortcut})` : action.label"
        @click="action.run(props.editor)"
      >
        <VizelIcon :name="action.icon" />
      </VizelToolbarButton>
    </template>
  </div>
</template>
