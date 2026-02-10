<script lang="ts" module>
import type { VizelMentionItem } from "@vizel/core";

export interface VizelMentionMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface VizelMentionMenuProps {
  items: VizelMentionItem[];
  class?: string;
  oncommand?: (item: VizelMentionItem) => void;
}
</script>

<script lang="ts">
import { tick } from "svelte";

let {
  items,
  class: className,
  oncommand,
}: VizelMentionMenuProps = $props();

let selectedIndex = $state(0);
let itemRefs: (HTMLElement | null)[] = $state([]);

$effect(() => {
  if (itemRefs.length > items.length) {
    itemRefs.length = items.length;
  }
});

// Reset selection when items change
$effect(() => {
  // Access items to track changes
  void items.length;
  selectedIndex = 0;
});

function scrollToSelected() {
  tick().then(() => {
    const el = itemRefs[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

function selectItem(index: number) {
  const item = items[index];
  if (item) {
    oncommand?.(item);
  }
}

export function onKeyDown(event: KeyboardEvent): boolean {
  if (event.key === "ArrowUp") {
    selectedIndex = (selectedIndex + items.length - 1) % items.length;
    scrollToSelected();
    return true;
  }
  if (event.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % items.length;
    scrollToSelected();
    return true;
  }
  if (event.key === "Enter") {
    selectItem(selectedIndex);
    return true;
  }
  return false;
}
</script>

<div class="vizel-mention-menu {className ?? ''}" data-vizel-mention-menu>
  {#if items.length === 0}
    <div class="vizel-mention-menu-empty">No results</div>
  {:else}
    {#each items as item, index (item.id)}
      <div
        bind:this={itemRefs[index]}
        class="vizel-mention-menu-item {index === selectedIndex ? 'is-selected' : ''}"
        role="option"
        aria-selected={index === selectedIndex}
        onclick={() => selectItem(index)}
        onkeydown={(e) => { if (e.key === "Enter") selectItem(index); }}
        tabindex={-1}
      >
        <div class="vizel-mention-menu-item-avatar">
          {#if item.avatar}
            <img src={item.avatar} alt={item.label} />
          {:else}
            {item.label.charAt(0).toUpperCase()}
          {/if}
        </div>
        <div class="vizel-mention-menu-item-content">
          <div class="vizel-mention-menu-item-label">{item.label}</div>
          {#if item.description}
            <div class="vizel-mention-menu-item-description">{item.description}</div>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>
