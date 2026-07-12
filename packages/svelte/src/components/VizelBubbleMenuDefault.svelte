<script lang="ts" module>
import type { Editor, VizelLocale } from "@vizel/core";

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
</script>

<script lang="ts">
import {
  createVizelBubbleMenuActions,
  filterVizelBubbleMenuActions,
  formatVizelTooltip,
  groupVizelBubbleMenuActions,
} from "@vizel/core";

import { createVizelState } from "../runes/createVizelState.svelte.js";
import VizelBubbleMenuButton from "./VizelBubbleMenuButton.svelte";
import VizelBubbleMenuColorPicker from "./VizelBubbleMenuColorPicker.svelte";
import VizelBubbleMenuDivider from "./VizelBubbleMenuDivider.svelte";
import VizelIcon from "./VizelIcon.svelte";
import VizelLinkEditor from "./VizelLinkEditor.svelte";
import VizelNodeSelector from "./VizelNodeSelector.svelte";

let { editor, class: className, enableEmbed, locale }: VizelBubbleMenuDefaultProps = $props();
let showLinkEditor = $state(false);

// Subscribe to editor state changes so derived isActive flags refresh.
const editorState = createVizelState(() => editor);

const filteredActions = $derived(
  filterVizelBubbleMenuActions(createVizelBubbleMenuActions(locale), editor)
);
const linkAction = $derived(filteredActions.find((a) => a.id === "link"));
const markGroups = $derived(
  groupVizelBubbleMenuActions(filteredActions.filter((a) => a.id !== "link"))
);

// Reading `editorState.version` inside the derived isActive map registers the
// version counter as a tracked dependency so re-renders happen on every
// selection change. The value itself is discarded.
const isActive = $derived.by(() => {
  void editorState.version;
  return (actionId: string): boolean => {
    const action = filteredActions.find((a) => a.id === actionId);
    return action ? action.isActive(editor) : false;
  };
});
</script>

{#if showLinkEditor}
  <VizelLinkEditor
    {editor}
    {...enableEmbed ? { enableEmbed } : {}}
    {...locale ? { locale } : {}}
    onclose={() => (showLinkEditor = false)}
  />
{:else}
  <div class="vizel-bubble-menu-toolbar {className ?? ''}">
    <VizelNodeSelector {editor} />
    <VizelBubbleMenuDivider />
    {#each markGroups as group, groupIndex (groupIndex)}
      {#if groupIndex > 0}<VizelBubbleMenuDivider />{/if}
      {#each group as action (action.id)}
        <VizelBubbleMenuButton
          action={action.id}
          isActive={isActive(action.id)}
          title={formatVizelTooltip(action.label, action.shortcut)}
          onclick={() => action.run(editor)}
        >
          <VizelIcon name={action.icon} />
        </VizelBubbleMenuButton>
      {/each}
    {/each}
    {#if linkAction}
      <VizelBubbleMenuDivider />
      <VizelBubbleMenuButton
        action={linkAction.id}
        isActive={isActive(linkAction.id)}
        title={formatVizelTooltip(linkAction.label, linkAction.shortcut)}
        onclick={() => (showLinkEditor = true)}
      >
        <VizelIcon name={linkAction.icon} />
      </VizelBubbleMenuButton>
    {/if}
    <VizelBubbleMenuDivider />
    <VizelBubbleMenuColorPicker {editor} type="textColor" {...locale ? { locale } : {}} />
    <VizelBubbleMenuColorPicker {editor} type="highlight" {...locale ? { locale } : {}} />
  </div>
{/if}
