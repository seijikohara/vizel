<script lang="ts" module>
import type { SlashCommandItem } from "@vizel/core";
import type { Snippet } from "svelte";

export interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface SlashMenuProps {
  /** The list of slash command items */
  items: SlashCommandItem[];
  /** Custom class name */
  class?: string;
  /** Command handler */
  oncommand?: (item: SlashCommandItem) => void;
  /** Custom item renderer */
  renderItem?: Snippet<[{ item: SlashCommandItem; isSelected: boolean; onclick: () => void }]>;
  /** Custom empty state renderer */
  renderEmpty?: Snippet;
}
</script>

<script lang="ts">
import { tick } from "svelte";
import SlashMenuItem from "./SlashMenuItem.svelte";
import SlashMenuEmpty from "./SlashMenuEmpty.svelte";

let {
  items,
  class: className,
  oncommand,
  renderItem,
  renderEmpty,
}: SlashMenuProps = $props();

  let selectedIndex = $state(0);
  let itemRefs: (HTMLElement | null)[] = $state([]);

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
    const item = items[index];
    if (item) {
      oncommand?.(item);
    }
  }

  export function onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === "ArrowUp") {
      selectedIndex = (selectedIndex + items.length - 1) % items.length;
      return true;
    }

    if (event.key === "ArrowDown") {
      selectedIndex = (selectedIndex + 1) % items.length;
      return true;
    }

    if (event.key === "Enter") {
      selectItem(selectedIndex);
      return true;
    }

    return false;
  }
</script>

<div class="vizel-slash-menu {className ?? ''}" data-vizel-slash-menu>
  {#if items.length === 0}
    {#if renderEmpty}
      {@render renderEmpty()}
    {:else}
      <SlashMenuEmpty />
    {/if}
  {:else}
    {#each items as item, index (item.title)}
      <div bind:this={itemRefs[index]}>
        {#if renderItem}
          {@render renderItem({
            item,
            isSelected: index === selectedIndex,
            onclick: () => selectItem(index),
          })}
        {:else}
          <SlashMenuItem
            {item}
            isSelected={index === selectedIndex}
            onclick={() => selectItem(index)}
          />
        {/if}
      </div>
    {/each}
  {/if}
</div>
