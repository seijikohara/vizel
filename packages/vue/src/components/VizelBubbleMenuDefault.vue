<script setup lang="ts">
import {
  createVizelBubbleMenuActions,
  type Editor,
  filterVizelBubbleMenuActions,
  formatVizelTooltip,
  groupVizelBubbleMenuActions,
  type VizelLocale,
} from "@vizel/core";
import { computed, ref } from "vue";
import { useVizelState } from "../composables/useVizelState.ts";
import VizelBubbleMenuButton from "./VizelBubbleMenuButton.vue";
import VizelBubbleMenuColorPicker from "./VizelBubbleMenuColorPicker.vue";
import VizelBubbleMenuDivider from "./VizelBubbleMenuDivider.vue";
import VizelIcon from "./VizelIcon.vue";
import VizelLinkEditor from "./VizelLinkEditor.vue";
import VizelNodeSelector from "./VizelNodeSelector.vue";

export interface VizelBubbleMenuDefaultProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = defineProps<VizelBubbleMenuDefaultProps>();

// Subscribe to editor state changes so derived isActive flags refresh.
const editorStateVersion = useVizelState(() => props.editor);

const filteredActions = computed(() =>
  filterVizelBubbleMenuActions(createVizelBubbleMenuActions(props.locale), props.editor)
);
const linkAction = computed(() => filteredActions.value.find((a) => a.id === "link"));
const markGroups = computed(() =>
  groupVizelBubbleMenuActions(filteredActions.value.filter((a) => a.id !== "link"))
);

// `isActive` reads from the editor state; tying it to `editorStateVersion`
// (a Ref that ticks on every transaction) is what triggers a re-render when
// the selection changes. The value itself is discarded.
const isActive = computed(() => {
  void editorStateVersion.value;
  return (actionId: string) => {
    const action = filteredActions.value.find((a) => a.id === actionId);
    return action ? action.isActive(props.editor) : false;
  };
});

const showLinkEditor = ref(false);
</script>

<template>
  <VizelLinkEditor
    v-if="showLinkEditor"
    :editor="props.editor"
    :enable-embed="props.enableEmbed"
    v-bind="props.locale ? { locale: props.locale } : {}"
    @close="showLinkEditor = false"
  />
  <div v-else :class="['vizel-bubble-menu-toolbar', $props.class]">
    <VizelNodeSelector :editor="props.editor" />
    <VizelBubbleMenuDivider />
    <template v-for="(group, groupIndex) in markGroups" :key="`group-${groupIndex}`">
      <VizelBubbleMenuDivider v-if="groupIndex > 0" />
      <VizelBubbleMenuButton
        v-for="action in group"
        :key="action.id"
        :action="action.id"
        :is-active="isActive(action.id)"
        :title="formatVizelTooltip(action.label, action.shortcut)"
        @click="action.run(props.editor)"
      >
        <VizelIcon :name="action.icon" />
      </VizelBubbleMenuButton>
    </template>
    <template v-if="linkAction">
      <VizelBubbleMenuDivider />
      <VizelBubbleMenuButton
        :action="linkAction.id"
        :is-active="isActive(linkAction.id)"
        :title="formatVizelTooltip(linkAction.label, linkAction.shortcut)"
        @click="showLinkEditor = true"
      >
        <VizelIcon :name="linkAction.icon" />
      </VizelBubbleMenuButton>
    </template>
    <VizelBubbleMenuDivider />
    <VizelBubbleMenuColorPicker :editor="props.editor" type="textColor" v-bind="props.locale ? { locale: props.locale } : {}" />
    <VizelBubbleMenuColorPicker :editor="props.editor" type="highlight" v-bind="props.locale ? { locale: props.locale } : {}" />
  </div>
</template>
