import { ref, computed, type Ref, type ComputedRef } from "vue";
import type { SlashCommandItem } from "@vizel/core";

export interface UseSlashMenuOptions {
  /** Initial items */
  initialItems?: SlashCommandItem[];
}

export interface UseSlashMenuReturn {
  /** Current items */
  items: Ref<SlashCommandItem[]>;
  /** Currently selected index */
  selectedIndex: Ref<number>;
  /** Whether the menu has items */
  hasItems: ComputedRef<boolean>;
  /** Currently selected item */
  selectedItem: ComputedRef<SlashCommandItem | undefined>;
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
 * Vue composable for managing SlashMenu state.
 * Provides reactive state and keyboard navigation handlers.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSlashMenu, SlashMenuItem } from '@vizel/vue';
 *
 * const {
 *   items,
 *   selectedIndex,
 *   setItems,
 *   selectItem,
 *   handleKeyDown,
 * } = useSlashMenu();
 *
 * // Use with SlashCommand suggestion
 * const suggestionConfig = {
 *   render: () => ({
 *     onStart: (props) => setItems(props.items),
 *     onUpdate: (props) => setItems(props.items),
 *     onKeyDown: ({ event }) => handleKeyDown(event),
 *   }),
 * };
 * </script>
 * ```
 */
export function useSlashMenu(options: UseSlashMenuOptions = {}): UseSlashMenuReturn {
  const { initialItems = [] } = options;

  const items = ref<SlashCommandItem[]>(initialItems);
  const selectedIndex = ref(0);

  const hasItems = computed(() => items.value.length > 0);
  const selectedItem = computed(() => items.value[selectedIndex.value]);

  function setItems(newItems: SlashCommandItem[]) {
    items.value = newItems;
    selectedIndex.value = 0;
  }

  function selectItem(index: number): SlashCommandItem | undefined {
    const item = items.value[index];
    return item;
  }

  function moveUp() {
    if (items.value.length === 0) return;
    selectedIndex.value =
      (selectedIndex.value + items.value.length - 1) % items.value.length;
  }

  function moveDown() {
    if (items.value.length === 0) return;
    selectedIndex.value = (selectedIndex.value + 1) % items.value.length;
  }

  function resetSelection() {
    selectedIndex.value = 0;
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
      // Return true to indicate the event was handled
      // The caller should use selectedItem.value to get the selected item
      return true;
    }

    return false;
  }

  return {
    items,
    selectedIndex,
    hasItems,
    selectedItem,
    setItems,
    selectItem,
    moveUp,
    moveDown,
    resetSelection,
    handleKeyDown,
  };
}
