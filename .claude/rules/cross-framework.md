---
paths: packages/**/*
---

# Cross-Framework Consistency

React, Vue, Svelte packages must maintain feature parity and consistent APIs.

## Core Package Centralization

All framework-agnostic code belongs in `@vizel/core`:

| Category | Location | Examples |
|----------|----------|----------|
| Types | `core/src/types.ts` | `VizelEditorOptions`, `VizelFeatureOptions` |
| Constants | `core/src/` | `VIZEL_UPLOAD_IMAGE_EVENT`, `VIZEL_TEXT_COLORS` |
| Extensions | `core/src/extensions/` | `VizelSlashCommand`, `VizelImageResize` |
| Utilities | `core/src/utils/` | `resolveVizelFeatures`, `createVizelImageUploader` |
| Styles | `core/src/styles/` | All CSS |

Framework packages only contain:
- Framework-specific components
- Framework-specific state management (hooks/composables/runes)

**No re-exports**: Framework packages do NOT re-export from `@vizel/core`. Users import directly:
- Vizel types/utilities from `@vizel/core`
- Tiptap types (`JSONContent`, `Editor`, etc.) from `@tiptap/core`

## Component Equivalence

Each component must exist in all three frameworks with equivalent functionality:

| Component | React | Vue | Svelte |
|-----------|-------|-----|--------|
| Vizel | `.tsx` | `.vue` | `.svelte` |
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
| VizelProvider | `.tsx` | `.vue` | `.svelte` |

### Props Interface

Props must be equivalent across frameworks:

```typescript
// All frameworks
interface VizelEditorProps {
  editor?: Editor | null;
  class?: string;  // Vue/Svelte use "class", React uses "className"
}

interface VizelBubbleMenuProps {
  editor?: Editor | null;
  class?: string;
  children?: ...;  // Framework-specific child type
}
```

## State Management Equivalence

| React | Vue | Svelte |
|-------|-----|--------|
| `hooks/` | `composables/` | `runes/` |
| `useVizelEditor` | `useVizelEditor` | `createVizelEditor` |
| `useVizelState` | `useVizelState` | `createVizelState` |
| `useVizelAutoSave` | `useVizelAutoSave` | `createVizelAutoSave` |
| `useVizelTheme` | `useVizelTheme` | `getVizelTheme` |
| `createVizelSlashMenuRenderer` | `createVizelSlashMenuRenderer` | `createVizelSlashMenuRenderer` |

### Naming Conventions

Each framework follows its idiomatic naming:

- **React**: `use*` prefix for hooks (React convention)
- **Vue**: `use*` prefix for composables (Vue convention)
- **Svelte**: `create*` for factory functions, `get*` for context getters (Svelte convention)

### Options Interface

All must accept identical options (defined in core):

```typescript
// @vizel/core - shared type
interface VizelEditorOptions {
  extensions?: Extensions;
  // ...
}
```

### Return Type Equivalence

| React | Vue | Svelte |
|-------|-----|--------|
| `Editor \| null` | `ShallowRef<Editor \| null>` | `{ get current(): Editor \| null }` |

## Context API Equivalence

| Feature | React | Vue | Svelte |
|---------|-------|-----|--------|
| Provider | `VizelProvider` | `VizelProvider` | `VizelProvider` |
| Consumer | `useVizelContext()` | `useVizelContext()` | `getVizelContext()` |
| Safe access | `useVizelContextSafe()` | `useVizelContextSafe()` | `getVizelContextSafe()` |

## Adding New Features

When adding a feature:

1. Add shared logic/types to `@vizel/core`
2. Implement in all three framework packages
3. Ensure props/options are consistent
4. Update all three demo apps
5. Verify with `bun run typecheck && bun run build`
