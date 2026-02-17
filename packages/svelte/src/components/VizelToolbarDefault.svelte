<script lang="ts" module>
import type { Editor, VizelLocale, VizelToolbarAction } from "@vizel/core";

export interface VizelToolbarDefaultProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Custom toolbar actions (defaults to vizelDefaultToolbarActions) */
  actions?: VizelToolbarAction[];
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import {
  createVizelToolbarActions,
  formatVizelTooltip,
  groupVizelToolbarActions,
  vizelDefaultToolbarActions,
} from "@vizel/core";
import { createVizelState } from "../runes/createVizelState.svelte.js";
import VizelIcon from "./VizelIcon.svelte";
import VizelToolbarButton from "./VizelToolbarButton.svelte";
import VizelToolbarDivider from "./VizelToolbarDivider.svelte";

let {
  editor,
  class: className,
  actions,
  locale,
}: VizelToolbarDefaultProps = $props();

const effectiveActions = $derived(actions ?? (locale ? createVizelToolbarActions(locale) : vizelDefaultToolbarActions));

// Subscribe to editor state changes to update active/enabled states
const editorState = createVizelState(() => editor);

const groups = $derived.by(() => {
  void editorState.current;
  return groupVizelToolbarActions(effectiveActions);
});
</script>

<div class="vizel-toolbar-content {className ?? ''}" data-vizel-toolbar>
  {#each groups as group, groupIndex (group[0]?.group ?? groupIndex)}
    {#if groupIndex > 0}
      <VizelToolbarDivider />
    {/if}
    {#each group as action (action.id)}
      <VizelToolbarButton
        action={action.id}
        isActive={action.isActive(editor)}
        disabled={!action.isEnabled(editor)}
        title={formatVizelTooltip(action.label, action.shortcut)}
        onclick={() => action.run(editor)}
      >
        <VizelIcon name={action.icon} />
      </VizelToolbarButton>
    {/each}
  {/each}
</div>
