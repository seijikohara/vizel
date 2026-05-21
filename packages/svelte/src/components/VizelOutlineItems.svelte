<script lang="ts" module>
import type { Editor, VizelOutlineItemSpec } from "@vizel/core";

export interface VizelOutlineItemsProps {
  items: readonly VizelOutlineItemSpec[];
  editor: Editor;
}
</script>

<script lang="ts">
import Self from "./VizelOutlineItems.svelte";

let { items, editor }: VizelOutlineItemsProps = $props();

const onItemClick = (pos: number) => {
  editor
    .chain()
    .focus()
    .setTextSelection(pos + 1)
    .run();
};
</script>

<!-- biome-ignore lint/a11y/useSemanticElements: WAI-ARIA tree pattern requires role="group" on nested lists inside role="tree". -->
<ul class="vizel-outline-list" role="group">
  {#each items as item (item.key)}
    <li
      role="treeitem"
      tabindex={-1}
      aria-level={item.level}
      aria-selected={item.isCurrent}
      aria-current={item.isCurrent ? "true" : undefined}
      class="vizel-outline-item vizel-outline-item--level-{item.level} {item.isCurrent
        ? 'vizel-outline-item--current'
        : ''}"
    >
      <button type="button" class="vizel-outline-link" onclick={() => onItemClick(item.pos)}>
        {item.label}
      </button>
      {#if item.children.length > 0}
        <Self items={item.children} {editor} />
      {/if}
    </li>
  {/each}
</ul>
