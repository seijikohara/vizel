<script setup lang="ts">
import type { Editor } from "@vizel/core";
import {
  createVizelToolbarActions,
  formatVizelTooltip,
  groupVizelToolbarActions,
  isVizelToolbarDropdownAction,
  type VizelLocale,
  type VizelToolbarActionItem,
  vizelDefaultToolbarActions,
} from "@vizel/core";
import { computed } from "vue";
import { useVizelState } from "../composables/useVizelState.ts";
import VizelIcon from "./VizelIcon.vue";
import VizelToolbarButton from "./VizelToolbarButton.vue";
import VizelToolbarDivider from "./VizelToolbarDivider.vue";
import VizelToolbarDropdown from "./VizelToolbarDropdown.vue";

export interface VizelToolbarDefaultProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Custom toolbar actions — supports both simple actions and dropdown actions */
  actions?: VizelToolbarActionItem[];
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = defineProps<VizelToolbarDefaultProps>();

const effectiveActions = computed(
  () =>
    props.actions ??
    (props.locale ? createVizelToolbarActions(props.locale) : vizelDefaultToolbarActions)
);

// Subscribe to editor state changes to update active/enabled states
const editorStateVersion = useVizelState(() => props.editor);

const groups = computed(() => {
  void editorStateVersion.value;
  return groupVizelToolbarActions(effectiveActions.value);
});
</script>

<template>
  <div :class="['vizel-toolbar-content', $props.class]" data-vizel-toolbar>
    <template v-for="(group, groupIndex) in groups" :key="group[0]?.group ?? groupIndex">
      <VizelToolbarDivider v-if="groupIndex > 0" />
      <template v-for="action in group" :key="action.id">
        <VizelToolbarDropdown
          v-if="isVizelToolbarDropdownAction(action)"
          :editor="props.editor"
          :dropdown="action"
        />
        <VizelToolbarButton
          v-else
          :action="action.id"
          :is-active="action.isActive(props.editor)"
          :disabled="!action.isEnabled(props.editor)"
          :title="formatVizelTooltip(action.label, action.shortcut)"
          @click="action.run(props.editor)"
        >
          <VizelIcon :name="action.icon" />
        </VizelToolbarButton>
      </template>
    </template>
  </div>
</template>
