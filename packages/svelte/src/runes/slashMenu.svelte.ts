import type { SlashCommandItem } from "@vizel/core";

export interface SlashMenuState {
  /** Current items */
  items: SlashCommandItem[];
  /** Currently selected index */
  selectedIndex: number;
  /** Whether the menu has items */
  readonly hasItems: boolean;
  /** Currently selected item */
  readonly selectedItem: SlashCommandItem | undefined;
  /** Set items */
  setItems: (newItems: SlashCommandItem[]) => void;
  /** Select an item by index */
  selectItem: (index: number) => SlashCommandItem | undefined;
  /** Move selection up */
  moveUp: () => void;
  /** Move selection down */
  moveDown: () => void;
  /** Reset selection to first item */
  resetSelection: () => void;
  /** Handle keyboard navigation, returns true if handled */
  handleKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * Creates a reactive SlashMenu state using Svelte 5 runes.
 * Provides state management and keyboard navigation.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { createSlashMenu, SlashMenuItem } from '@vizel/svelte';
 *
 * const slashMenu = createSlashMenu();
 *
 * // Use with SlashCommand suggestion
 * const suggestionConfig = {
 *   render: () => ({
 *     onStart: (props) => slashMenu.setItems(props.items),
 *     onUpdate: (props) => slashMenu.setItems(props.items),
 *     onKeyDown: ({ event }) => slashMenu.handleKeyDown(event),
 *   }),
 * };
 * </script>
 *
 * {#each slashMenu.items as item, index}
 *   <SlashMenuItem
 *     {item}
 *     isSelected={index === slashMenu.selectedIndex}
 *     onclick={() => slashMenu.selectItem(index)}
 *   />
 * {/each}
 * ```
 */
export function createSlashMenu(
  initialItems: SlashCommandItem[] = []
): SlashMenuState {
  let items = $state<SlashCommandItem[]>(initialItems);
  let selectedIndex = $state(0);

  const hasItems = $derived(items.length > 0);
  const selectedItem = $derived(items[selectedIndex]);

  function setItems(newItems: SlashCommandItem[]) {
    items = newItems;
    selectedIndex = 0;
  }

  function selectItem(index: number): SlashCommandItem | undefined {
    return items[index];
  }

  function moveUp() {
    if (items.length === 0) return;
    selectedIndex = (selectedIndex + items.length - 1) % items.length;
  }

  function moveDown() {
    if (items.length === 0) return;
    selectedIndex = (selectedIndex + 1) % items.length;
  }

  function resetSelection() {
    selectedIndex = 0;
  }

  function handleKeyDown(event: KeyboardEvent): boolean {
    if (event.key === "ArrowUp") {
      moveUp();
      return true;
    }

    if (event.key === "ArrowDown") {
      moveDown();
      return true;
    }

    if (event.key === "Enter") {
      return true;
    }

    return false;
  }

  return {
    get items() {
      return items;
    },
    set items(value: SlashCommandItem[]) {
      items = value;
    },
    get selectedIndex() {
      return selectedIndex;
    },
    set selectedIndex(value: number) {
      selectedIndex = value;
    },
    get hasItems() {
      return hasItems;
    },
    get selectedItem() {
      return selectedItem;
    },
    setItems,
    selectItem,
    moveUp,
    moveDown,
    resetSelection,
    handleKeyDown,
  };
}
