import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import {
  defaultGroupOrder,
  defaultSlashCommands,
  filterSlashCommands,
  flattenSlashCommandGroups,
  groupSlashCommands,
  type SlashCommandGroup,
  type SlashCommandItem,
  type SlashCommandRange,
  type SlashCommandSearchResult,
  searchSlashCommands,
} from "../commands/slash-items.ts";

export interface SlashCommandOptions {
  /** Custom slash command items (defaults to heading, list, quote, code) */
  items?: SlashCommandItem[];
  /** Suggestion options for customizing the popup behavior */
  suggestion?: Partial<SuggestionOptions>;
}

/** Type guard for SlashCommandItem */
const isSlashCommandItem = (value: unknown): value is SlashCommandItem =>
  typeof value === "object" && value !== null && "title" in value && "command" in value;

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      items: defaultSlashCommands,
      suggestion: {
        char: "/",
        startOfLine: false,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: this.options.suggestion?.char ?? "/",
        startOfLine: this.options.suggestion?.startOfLine ?? false,
        items: ({ query }) => {
          return filterSlashCommands(this.options.items ?? [], query);
        },
        command: ({ editor, range, props }) => {
          if (isSlashCommandItem(props)) {
            props.command({ editor, range });
          }
        },
        ...this.options.suggestion,
      }),
    ];
  },
});

export {
  defaultGroupOrder,
  defaultSlashCommands,
  filterSlashCommands,
  flattenSlashCommandGroups,
  groupSlashCommands,
  searchSlashCommands,
  type SlashCommandGroup,
  type SlashCommandItem,
  type SlashCommandRange,
  type SlashCommandSearchResult,
};
