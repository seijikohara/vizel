/**
 * Import Tiptap extension types to include their module augmentations.
 * These augmentations add extension-specific commands to the ChainedCommands interface.
 *
 * Note: These bare side-effect imports are safe for React/Vue because Rollup
 * tree-shakes them away (no exports are used). Svelte uses triple-slash
 * directives instead because svelte-package preserves bare imports verbatim.
 */

import "@tiptap/extension-bold";
import "@tiptap/extension-code";
import "@tiptap/extension-color";
import "@tiptap/extension-highlight";
import "@tiptap/extension-italic";
import "@tiptap/extension-strike";
import "@tiptap/extension-text-style";
import "@tiptap/extension-underline";
