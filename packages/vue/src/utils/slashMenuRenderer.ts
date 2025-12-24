import type { SlashCommandItem } from "@vizel/core";
import tippy, { type Instance as TippyInstance } from "tippy.js";

interface SlashMenuState {
  popup: TippyInstance[] | null;
  menuElement: HTMLElement | null;
  selectedIndex: number;
  items: SlashCommandItem[];
  commandFn: ((item: SlashCommandItem) => void) | null;
}

/**
 * Creates a vanilla JS slash menu renderer for Vue/Svelte apps.
 * This is a framework-agnostic implementation using tippy.js.
 *
 * @example
 * ```ts
 * import { SlashCommand, defaultSlashCommands, createVanillaSlashMenuRenderer } from "@vizel/vue";
 *
 * const editor = new Editor({
 *   extensions: [
 *     SlashCommand.configure({
 *       items: defaultSlashCommands,
 *       suggestion: createVanillaSlashMenuRenderer(),
 *     }),
 *   ],
 * });
 * ```
 */
export function createVanillaSlashMenuRenderer() {
  const state: SlashMenuState = {
    popup: null,
    menuElement: null,
    selectedIndex: 0,
    items: [],
    commandFn: null,
  };

  function renderMenu() {
    if (!state.menuElement) return;

    if (state.items.length === 0) {
      state.menuElement.innerHTML = `
        <div class="vizel-slash-menu-empty">No results</div>
      `;
      return;
    }

    state.menuElement.innerHTML = state.items
      .map(
        (item, index) => `
        <button class="vizel-slash-menu-item ${index === state.selectedIndex ? "is-selected" : ""}" data-index="${index}">
          <span class="vizel-slash-menu-icon">${item.icon}</span>
          <div class="vizel-slash-menu-text">
            <span class="vizel-slash-menu-title">${item.title}</span>
            <span class="vizel-slash-menu-description">${item.description}</span>
          </div>
        </button>
      `
      )
      .join("");

    state.menuElement.querySelectorAll(".vizel-slash-menu-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number.parseInt(btn.getAttribute("data-index") || "0", 10);
        if (state.commandFn && state.items[index]) {
          state.commandFn(state.items[index]);
        }
      });
    });
  }

  return {
    render: () => ({
      onStart: (props: {
        items: SlashCommandItem[];
        command: (item: SlashCommandItem) => void;
        clientRect?: (() => DOMRect) | null;
      }) => {
        state.items = props.items;
        state.commandFn = props.command;
        state.selectedIndex = 0;

        state.menuElement = document.createElement("div");
        state.menuElement.className = "vizel-slash-menu";
        renderMenu();

        if (!props.clientRect) return;

        state.popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: state.menuElement,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate: (props: {
        items: SlashCommandItem[];
        command: (item: SlashCommandItem) => void;
        clientRect?: (() => DOMRect) | null;
      }) => {
        state.items = props.items;
        state.commandFn = props.command;
        state.selectedIndex = 0;
        renderMenu();

        if (props.clientRect) {
          state.popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect,
          });
        }
      },

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === "ArrowUp") {
          state.selectedIndex = (state.selectedIndex + state.items.length - 1) % state.items.length;
          renderMenu();
          return true;
        }
        if (props.event.key === "ArrowDown") {
          state.selectedIndex = (state.selectedIndex + 1) % state.items.length;
          renderMenu();
          return true;
        }
        if (props.event.key === "Enter") {
          const item = state.items[state.selectedIndex];
          if (state.commandFn && item) {
            state.commandFn(item);
          }
          return true;
        }
        if (props.event.key === "Escape") {
          state.popup?.[0]?.hide();
          return true;
        }
        return false;
      },

      onExit: () => {
        state.popup?.[0]?.destroy();
        state.menuElement = null;
      },
    }),
  };
}
