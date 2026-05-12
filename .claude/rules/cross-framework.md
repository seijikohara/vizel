---
paths:
  - "packages/{react,vue,svelte}/**/*"
  - "packages/core/src/types.ts"
---

# Cross-Framework Consistency

The React, Vue, and Svelte packages must maintain feature parity and consistent APIs.

## Source of Truth

`@vizel/core` owns all framework-agnostic code. See `packages/core.md` for the centralization rules.

The framework packages do NOT re-export symbols from `@vizel/core`. Consumers import shared symbols directly:

- Import Vizel types and utilities from `@vizel/core`.
- Import Tiptap types (`JSONContent`, `Editor`, etc.) from `@tiptap/core`.

## Component Equivalence

Each component must exist in all three framework packages with equivalent functionality.

| Component | React | Vue | Svelte |
|-----------|-------|-----|--------|
| Vizel | `.tsx` | `.vue` | `.svelte` |
| VizelBlockMenu | `.tsx` | `.vue` | `.svelte` |
| VizelEditor | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenu | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenuDefault | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenuButton | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenuDivider | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenuColorPicker | `.tsx` | `.vue` | `.svelte` |
| VizelLinkEditor | `.tsx` | `.vue` | `.svelte` |
| VizelNodeSelector | `.tsx` | `.vue` | `.svelte` |
| VizelSlashMenu | `.tsx` | `.vue` | `.svelte` |
| VizelSlashMenuItem | `.tsx` | `.vue` | `.svelte` |
| VizelSlashMenuEmpty | `.tsx` | `.vue` | `.svelte` |
| VizelThemeProvider | `.tsx` | `.vue` | `.svelte` |
| VizelSaveIndicator | `.tsx` | `.vue` | `.svelte` |
| VizelPortal | `.tsx` | `.vue` | `.svelte` |
| VizelColorPicker | `.tsx` | `.vue` | `.svelte` |
| VizelEmbedView | `.tsx` | `.vue` | `.svelte` |
| VizelIcon | `.tsx` | `.vue` | `.svelte` |
| VizelIconProvider | `.tsx` | `.vue` | `.svelte` |
| VizelProvider | `.tsx` | `.vue` | `.svelte` |
| VizelFindReplace | `.tsx` | `.vue` | `.svelte` |
| VizelMentionMenu | `.tsx` | `.vue` | `.svelte` |
| VizelToolbar | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarButton | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarDefault | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarDivider | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarDropdown | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarOverflow | `.tsx` | `.vue` | `.svelte` |

## Props Interface

Each component exposes equivalent props across frameworks. React uses `className`. Vue and Svelte use `class`.

```typescript
interface VizelEditorProps {
  editor?: Editor | null;
  class?: string; // React: className
}

interface VizelBubbleMenuProps {
  editor?: Editor | null;
  class?: string;
  children?: ReactNode | VNode | Snippet; // framework-specific child type
}
```

## State Management Equivalence

Each framework exposes equivalent state primitives under its idiomatic naming.

| React (`hooks/`) | Vue (`composables/`) | Svelte (`runes/`) |
|------------------|----------------------|--------------------|
| `useVizelEditor` | `useVizelEditor` | `createVizelEditor` |
| `useVizelState` | `useVizelState` | `createVizelState` |
| `useVizelEditorState` | `useVizelEditorState` | `createVizelEditorState` |
| `useVizelAutoSave` | `useVizelAutoSave` | `createVizelAutoSave` |
| `useVizelMarkdown` | `useVizelMarkdown` | `createVizelMarkdown` |
| `useVizelTheme` | `useVizelTheme` | `getVizelTheme` |
| `useVizelContext` | `useVizelContext` | `getVizelContext` |
| `useVizelIconContext` | `useVizelIconContext` | `getVizelIconContext` |
| `createVizelSlashMenuRenderer` | `createVizelSlashMenuRenderer` | `createVizelSlashMenuRenderer` |
| `createVizelMentionMenuRenderer` | `createVizelMentionMenuRenderer` | `createVizelMentionMenuRenderer` |
| `useVizelCollaboration` | `useVizelCollaboration` | `createVizelCollaboration` |
| `useVizelComment` | `useVizelComment` | `createVizelComment` |
| `useVizelVersionHistory` | `useVizelVersionHistory` | `createVizelVersionHistory` |

### Naming Conventions

Each framework follows its idiomatic naming:

- **React**: prefix hooks with `use`.
- **Vue**: prefix composables with `use`.
- **Svelte**: prefix factories with `create` and context getters with `get`.

### Options Interface

All packages accept identical options. Define the option types in `@vizel/core`:

```typescript
// @vizel/core
interface VizelEditorOptions {
  extensions?: Extensions;
  // ...
}
```

### Return Type Equivalence

| React | Vue | Svelte |
|-------|-----|--------|
| `Editor \| null` | `ShallowRef<Editor \| null>` | `{ get current(): Editor \| null }` |

### Editor Accessor Convention

Each framework accepts the editor in the shape that is idiomatic for its
reactivity model.

| Framework | Hook / composable / rune signature |
|-----------|-----------------------------------|
| React | `useVizelX(editor: Editor \| null \| undefined, options?)` — pass the editor value directly. React reads the variable each render, no getter indirection needed. |
| Vue | `useVizelX(() => editor.value, options?)` — pass a getter that reads `.value` so the composable can track the `ShallowRef` across changes. |
| Svelte | `createVizelX(() => editor.current, options?)` — pass a getter that reads `.current` so the rune can react inside `$effect`. |

The cross-framework concept (`hook(editor, options)`) is identical; only the
binding form differs to honor each framework's reactivity model.

### Context Consumer Return Shape

| React | Vue | Svelte |
|-------|-----|--------|
| `{ editor: Editor \| null }` | `ComputedRef<Editor \| null>` (both `useVizelContext()` and `useVizelContextSafe()`; the safe variant returns `null` outside a provider) | `{ get current(): Editor \| null }` |

## Context API Equivalence

| Feature | React | Vue | Svelte |
|---------|-------|-----|--------|
| Provider | `VizelProvider` | `VizelProvider` | `VizelProvider` |
| Consumer (required) | `useVizelContext()` | `useVizelContext()` | `getVizelContext()` |
| Consumer (optional) | `useVizelContextSafe()` | `useVizelContextSafe()` | `getVizelContextSafe()` |

## Adding a New Feature

Follow this sequence to add a feature with consistent cross-framework support:

1. Add shared logic and types to `@vizel/core`.
2. Implement the feature in all three framework packages.
3. Verify props, options, and return types match across frameworks.
4. Update each demo app to exercise the feature.
5. Add Playwright Component Tests with shared scenarios under `tests/ct/scenarios/`.
6. Run `pnpm typecheck && pnpm build && pnpm test:ct`.
