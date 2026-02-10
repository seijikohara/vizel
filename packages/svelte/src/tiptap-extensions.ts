/**
 * Reference Tiptap extension types to include their module augmentations.
 * These augmentations add extension-specific commands to the ChainedCommands interface.
 *
 * Uses triple-slash directives instead of bare imports to avoid emitting
 * runtime JavaScript. svelte-package preserves bare imports verbatim,
 * causing ProseMirror module duplication when consumers exclude @vizel/svelte
 * from Vite's optimizeDeps.
 *
 * Ref: https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html
 */

/// <reference types="@tiptap/extension-bold" />
/// <reference types="@tiptap/extension-code" />
/// <reference types="@tiptap/extension-color" />
/// <reference types="@tiptap/extension-highlight" />
/// <reference types="@tiptap/extension-italic" />
/// <reference types="@tiptap/extension-strike" />
/// <reference types="@tiptap/extension-text-style" />
/// <reference types="@tiptap/extension-underline" />
/// <reference types="@tiptap/extension-superscript" />
/// <reference types="@tiptap/extension-subscript" />

export {};
