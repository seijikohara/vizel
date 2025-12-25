<script lang="ts" module>
export interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}
</script>

<script lang="ts">
  import { tick } from "svelte";
  import type { SlashCommandItem } from "@vizel/core";
  import type { Snippet } from "svelte";
  import SlashMenuItem from "./SlashMenuItem.svelte";
  import SlashMenuEmpty from "./SlashMenuEmpty.svelte";

  interface Props {
    items: SlashCommandItem[];
    class?: string;
    oncommand?: (item: SlashCommandItem) => void;
    renderItem?: Snippet<[{ item: SlashCommandItem; isSelected: boolean; onclick: () => void }]>;
    renderEmpty?: Snippet;
  }

  let {
    items,
    class: className,
    oncommand,
    renderItem,
    renderEmpty,
  }: Props = $props();

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
