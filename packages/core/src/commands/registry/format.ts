import type { VizelCommand } from "../types.ts";

/**
 * Mark-level format commands (bold, italic, strike, etc.).
 *
 * These commands appear on the toolbar and bubble menu but not on the
 * slash menu — users discover them via toolbar buttons and keyboard
 * shortcuts, not by typing `/`.
 */
export const vizelFormatCommands: readonly VizelCommand[] = [
  {
    id: "format/bold",
    label: (locale) => locale.toolbar.bold,
    icon: "bold",
    shortcut: { mac: "Mod-B", other: "Mod-B" },
    canRun: (editor) => editor.can().toggleBold(),
    isActive: (editor) => editor.isActive("bold"),
    run: (editor) => editor.chain().focus().toggleBold().run(),
    surfaces: {
      toolbar: { priority: 10 },
      bubbleMenu: { priority: 10 },
      shortcut: true,
    },
  },
  {
    id: "format/italic",
    label: (locale) => locale.toolbar.italic,
    icon: "italic",
    shortcut: { mac: "Mod-I", other: "Mod-I" },
    canRun: (editor) => editor.can().toggleItalic(),
    isActive: (editor) => editor.isActive("italic"),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    surfaces: {
      toolbar: { priority: 20 },
      bubbleMenu: { priority: 20 },
      shortcut: true,
    },
  },
  {
    id: "format/strike",
    label: (locale) => locale.toolbar.strikethrough,
    icon: "strikethrough",
    shortcut: { mac: "Mod-Shift-X", other: "Mod-Shift-X" },
    canRun: (editor) => editor.can().toggleStrike(),
    isActive: (editor) => editor.isActive("strike"),
    run: (editor) => editor.chain().focus().toggleStrike().run(),
    surfaces: {
      toolbar: { priority: 30 },
      bubbleMenu: { priority: 30 },
      shortcut: true,
    },
  },
  {
    id: "format/underline",
    label: (locale) => locale.toolbar.underline,
    icon: "underline",
    shortcut: { mac: "Mod-U", other: "Mod-U" },
    canRun: (editor) => editor.can().toggleUnderline?.() ?? false,
    isActive: (editor) => editor.isActive("underline"),
    run: (editor) => editor.chain().focus().toggleUnderline().run(),
    surfaces: {
      toolbar: { priority: 40 },
      bubbleMenu: { priority: 40 },
      shortcut: true,
    },
  },
  {
    id: "format/code",
    label: (locale) => locale.toolbar.code,
    icon: "code",
    shortcut: { mac: "Mod-E", other: "Mod-E" },
    canRun: (editor) => editor.can().toggleCode(),
    isActive: (editor) => editor.isActive("code"),
    run: (editor) => editor.chain().focus().toggleCode().run(),
    surfaces: {
      toolbar: { priority: 50 },
      bubbleMenu: { priority: 50 },
      shortcut: true,
    },
  },
  {
    id: "format/superscript",
    label: (locale) => locale.bubbleMenu.superscript,
    icon: "superscript",
    shortcut: { mac: "Mod-.", other: "Mod-." },
    canRun: (editor) => editor.can().toggleSuperscript?.() ?? false,
    isActive: (editor) => editor.isActive("superscript"),
    run: (editor) => editor.chain().focus().toggleSuperscript().run(),
    surfaces: {
      bubbleMenu: { priority: 60 },
      shortcut: true,
    },
  },
  {
    id: "format/subscript",
    label: (locale) => locale.bubbleMenu.subscript,
    icon: "subscript",
    shortcut: { mac: "Mod-,", other: "Mod-," },
    canRun: (editor) => editor.can().toggleSubscript?.() ?? false,
    isActive: (editor) => editor.isActive("subscript"),
    run: (editor) => editor.chain().focus().toggleSubscript().run(),
    surfaces: {
      bubbleMenu: { priority: 70 },
      shortcut: true,
    },
  },
];
