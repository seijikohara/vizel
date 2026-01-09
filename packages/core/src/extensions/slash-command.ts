import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import {
  filterSlashCommands as filterVizelSlashCommands,
  flattenSlashCommandGroups as flattenVizelSlashCommandGroups,
  groupSlashCommands as groupVizelSlashCommands,
  searchSlashCommands as searchVizelSlashCommands,
  type SlashCommandGroup as VizelSlashCommandGroup,
  type SlashCommandItem as VizelSlashCommandItem,
  type SlashCommandRange as VizelSlashCommandRange,
  type SlashCommandSearchResult as VizelSlashCommandSearchResult,
  defaultGroupOrder as vizelDefaultGroupOrder,
  defaultSlashCommands as vizelDefaultSlashCommands,
} from "../commands/slash-items.ts";

export interface VizelSlashCommandExtensionOptions {
  /** Custom slash command items (defaults to heading, list, quote, code) */
  items?: VizelSlashCommandItem[];
  /** Suggestion options for customizing the popup behavior */
  suggestion?: Partial<SuggestionOptions>;
}

/** Type guard for VizelSlashCommandItem */
const isVizelSlashCommandItem = (value: unknown): value is VizelSlashCommandItem =>
  typeof value === "object" && value !== null && "title" in value && "command" in value;

export const VizelSlashCommand = Extension.create<VizelSlashCommandExtensionOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      items: vizelDefaultSlashCommands,
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
          return filterVizelSlashCommands(this.options.items ?? [], query);
        },
        command: ({ editor, range, props }) => {
          if (isVizelSlashCommandItem(props)) {
            props.command({ editor, range });
          }
        },
        ...this.options.suggestion,
      }),
    ];
  },
});

export {
  vizelDefaultGroupOrder,
  vizelDefaultSlashCommands,
  filterVizelSlashCommands,
  flattenVizelSlashCommandGroups,
  groupVizelSlashCommands,
  searchVizelSlashCommands,
  type VizelSlashCommandGroup,
  type VizelSlashCommandItem,
  type VizelSlashCommandRange,
  type VizelSlashCommandSearchResult,
};
