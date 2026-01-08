<script lang="ts" module>
import type { VizelSlashCommandItem } from "@vizel/core";
import type { Snippet } from "svelte";

export interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface SlashMenuProps {
  /** The list of slash command items */
  items: VizelSlashCommandItem[];
  /** Custom class name */
  class?: string;
  /** Command handler */
  oncommand?: (item: VizelSlashCommandItem) => void;
  /** Whether to show items grouped by category (default: true when not searching) */
  showGroups?: boolean;
  /** Custom group order */
  groupOrder?: string[];
  /** Custom item renderer */
  renderItem?: Snippet<[{ item: VizelSlashCommandItem; isSelected: boolean; onclick: () => void }]>;
  /** Custom empty state renderer */
  renderEmpty?: Snippet;
}
</script>

<script lang="ts">
import { groupVizelSlashCommands, type VizelSlashCommandGroup } from "@vizel/core";
import { tick } from "svelte";
import VizelSlashMenuItem from "./VizelSlashMenuItem.svelte";
import VizelSlashMenuEmpty from "./VizelSlashMenuEmpty.svelte";

let {
  items,
  class: className,
  oncommand,
  showGroups = true,
  groupOrder,
  renderItem,
  renderEmpty,
}: SlashMenuProps = $props();

let selectedIndex = $state(0);
let itemRefs: (HTMLElement | null)[] = $state([]);

// Clean up itemRefs when items decrease
$effect(() => {
  const length = flatItems.length;
  if (itemRefs.length > length) {
    itemRefs.length = length;
  }
});

// Group items when showGroups is true and there are enough items
const groups = $derived.by<VizelSlashCommandGroup[]>(() => {
  if (!showGroups || items.length <= 5) {
    // Don't group if explicitly disabled or few items (likely search results)
    return [{ name: "", items }];
  }
  return groupVizelSlashCommands(items, groupOrder);
});

// Flatten for navigation
const flatItems = $derived(groups.flatMap((g) => g.items));

// Reset selection when items change
$effect(() => {
  items;
  selectedIndex = 0;
});

// Scroll selected item into view when selection changes
$effect(() => {
  const index = selectedIndex;
  tick().then(() => {
    const selectedElement = itemRefs[index];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
});

function selectItem(index: number) {
  const item = flatItems[index];
  if (item) {
    oncommand?.(item);
  }
}

// Navigate to next group with Tab
function tabHandler() {
  if (groups.length <= 1) return;

  let currentGroupIndex = 0;
  let itemCount = 0;
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (!group) continue;
    if (selectedIndex < itemCount + group.items.length) {
      currentGroupIndex = i;
      break;
    }
    itemCount += group.items.length;
  }

  // Move to next group
  const nextGroupIndex = (currentGroupIndex + 1) % groups.length;
  let nextIndex = 0;
  for (let i = 0; i < nextGroupIndex; i++) {
    const group = groups[i];
    if (group) {
      nextIndex += group.items.length;
    }
  }
  selectedIndex = nextIndex;
}

// Calculate global index for items
function getGlobalIndex(groupIndex: number, itemIndex: number): number {
  let index = 0;
  for (let i = 0; i < groupIndex; i++) {
    const group = groups[i];
    if (group) {
      index += group.items.length;
    }
  }
  return index + itemIndex;
}

export function onKeyDown(event: KeyboardEvent): boolean {
  if (event.key === "ArrowUp") {
    selectedIndex = (selectedIndex + flatItems.length - 1) % flatItems.length;
    return true;
  }

  if (event.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % flatItems.length;
    return true;
  }

  if (event.key === "Enter") {
    selectItem(selectedIndex);
    return true;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    tabHandler();
    return true;
  }

  return false;
}
</script>

<div class="vizel-slash-menu {className ?? ''}" data-vizel-slash-menu>
  {#if flatItems.length === 0}
    {#if renderEmpty}
      {@render renderEmpty()}
    {:else}
      <VizelSlashMenuEmpty />
    {/if}
  {:else}
    {#each groups as group, groupIndex (group.name || groupIndex)}
      {#if group.name}
        <!-- Group with header -->
        <div class="vizel-slash-menu-group" data-vizel-slash-menu-group>
          <div class="vizel-slash-menu-group-header">{group.name}</div>
          {#each group.items as item, itemIndex (item.title)}
            {@const globalIdx = getGlobalIndex(groupIndex, itemIndex)}
            <div bind:this={itemRefs[globalIdx]}>
              {#if renderItem}
                {@render renderItem({
                  item,
                  isSelected: globalIdx === selectedIndex,
                  onclick: () => selectItem(globalIdx),
                })}
              {:else}
                <VizelSlashMenuItem
                  {item}
                  isSelected={globalIdx === selectedIndex}
                  onclick={() => selectItem(globalIdx)}
                />
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <!-- Items without group header -->
        {#each group.items as item, itemIndex (item.title)}
          {@const globalIdx = getGlobalIndex(groupIndex, itemIndex)}
          <div bind:this={itemRefs[globalIdx]}>
            {#if renderItem}
              {@render renderItem({
                item,
                isSelected: globalIdx === selectedIndex,
                onclick: () => selectItem(globalIdx),
              })}
            {:else}
              <VizelSlashMenuItem
                {item}
                isSelected={globalIdx === selectedIndex}
                onclick={() => selectItem(globalIdx)}
              />
            {/if}
          </div>
        {/each}
      {/if}
    {/each}
  {/if}
</div>
