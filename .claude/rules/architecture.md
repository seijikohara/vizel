# Architecture

This file is the single source of truth (SSOT) for Vizel's package-layering
rules. It loads at startup with the same priority as `CLAUDE.md`. The
cross-framework rules in `.claude/rules/cross-framework.md` defer to this
file — if they conflict, this file wins.

## Product Identity

Vizel is a **block-based visual Markdown editor** built on Tiptap. The product:

- Edits content as Tiptap nodes (block-level structure) but Markdown is the
  source of truth on save and load. Tiptap's internal HTML is an editing-time
  representation, not a persisted format.
- Targets a Notion-like authoring experience: slash menu, drag handle,
  mentions, block menu, embeds, find-and-replace, version history, comments,
  collaboration.
- Ships React, Vue, and Svelte adapters around the same Tiptap configuration.

## Core Concepts (binding)

1. **`@vizel/core` is framework-agnostic.**
   A facade over Tiptap. It never imports React, Vue, or Svelte runtimes or
   types. It exposes three categories of API and nothing else:
   - **Tiptap extensions** and configuration helpers.
   - **Pure builders** that produce framework-neutral specs (DOM shape + ARIA
     wiring + derived state). These are deterministic functions of their inputs
     with no side effects.
   - **Controller factories** that own DOM side effects behind a
     `{ mount(target), unmount() }` interface. Framework components must never
     call `document.addEventListener` directly — they pass an element into a
     controller and let it own the listener.

   The concrete directory layout for these three categories appears in
   `.claude/rules/packages/core.md` under "Four-Layer Structure".

2. **Framework packages are thin adapters.**
   `@vizel/react`, `@vizel/vue`, and `@vizel/svelte` only:
   - Bind the editor to the framework lifecycle (mount, update, unmount).
   - Convert framework-idiomatic props / refs / snippets to the Core spec or
     controller shape and back.

   They do not implement ARIA wiring, keyboard navigation, dismissal logic,
   focus management, or state derivation. Those live in Core. Each
   framework-side component file should fit within ~120 lines of view code; if
   it grows past that, the excess is logic that belongs in Core.

3. **UI components ship as Core skeletons + framework renderers.**
   Every menu, popover, and form (`VizelSlashMenu`, `VizelMentionMenu`,
   `VizelBlockMenu`, `VizelToolbarDropdown`, `VizelNodeSelector`,
   `VizelLinkEditor`, `VizelFindReplace`, `VizelColorPicker`,
   `VizelBubbleMenu`, ...) declares its DOM scaffolding as a typed spec in
   `packages/core/src/skeletons/`. The framework component is a thin
   transformer that maps the spec to native template syntax. ARIA attributes,
   identifiers, and section/item structure live in the spec — frameworks do
   not duplicate them.

## Consumer-facing invariants

These hold across every framework package:

- **Import surface.** Installing one of `@vizel/react`, `@vizel/vue`, or
  `@vizel/svelte` is sufficient to render Vizel. Consumers never need to
  `import` from `@vizel/core` for normal use; framework packages re-export the
  symbols a consumer is expected to touch (types, locale, error class, action
  helpers).
- **Style surface.** A single CSS entry per framework package (e.g.
  `@vizel/react/styles.css`). No hand-mounting of additional stylesheets is
  required to make any built-in component render correctly.
- **Symmetric API.** Component props, hook / composable / rune names, return
  shapes, and event payloads mirror each other across the three frameworks,
  modulo idiomatic naming (`useFoo` in React and Vue, `createFoo` in Svelte).
  Any divergence requires a rationale comment in the diverging package.
- **Loud errors at boundaries.** Misuse — conflicting props, invalid editor
  configuration, missing context — is rejected with a typed `VizelError`
  carrying a stable error code, not a `console.warn` + silent fallback.
- **SSR safe.** All Core utilities guard `document` / `window` access and
  produce no DOM side effects until a framework lifecycle hook (`onMount`,
  `useEffect`, Vue `onMounted`) runs.

## When to deviate

These rules are binding. If a feature seems to require deviation, add a brief
exception (file path, rationale, expiry condition) to the relevant package
rule under `.claude/rules/packages/` in the same pull request that introduces
the deviation. Drift without an exception entry is a review-blocker.
