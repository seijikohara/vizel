---
paths: packages/**/*
---

# Cross-Framework Consistency

React, Vue, Svelte packages must maintain feature parity and consistent APIs.

## Core Package Centralization

All framework-agnostic code belongs in `@vizel/core`:

| Category | Location | Examples |
|----------|----------|----------|
| Types | `core/src/types.ts` | `JSONContent`, `VizelEditorOptions` |
| Constants | `core/src/` | `VIZEL_UPLOAD_IMAGE_EVENT` |
| Extensions | `core/src/extensions/` | `SlashCommand`, `ImageResize` |
| Utilities | `core/src/utils/` | `resolveFeatures`, `createImageUploader` |
| Styles | `core/src/styles/` | All CSS |

Framework packages only contain:
- Framework-specific components
- Framework-specific state management (hooks/composables/runes)
- Re-exports from core

## Component Equivalence

Each component must exist in all three frameworks with equivalent functionality:

| Component | React | Vue | Svelte |
|-----------|-------|-----|--------|
| EditorContent | `.tsx` | `.vue` | `.svelte` |
| EditorRoot | `.tsx` | `.vue` | `.svelte` |
| BubbleMenu | `.tsx` | `.vue` | `.svelte` |
| BubbleMenuToolbar | `.tsx` | `.vue` | `.svelte` |
| BubbleMenuButton | `.tsx` | `.vue` | `.svelte` |
| BubbleMenuDivider | `.tsx` | `.vue` | `.svelte` |
| BubbleMenuLinkEditor | `.tsx` | `.vue` | `.svelte` |
| SlashMenu | `.tsx` | `.vue` | `.svelte` |
| SlashMenuItem | `.tsx` | `.vue` | `.svelte` |
| SlashMenuEmpty | `.tsx` | `.vue` | `.svelte` |

### Props Interface

Props must be equivalent across frameworks:

```typescript
// All frameworks
interface EditorContentProps {
  editor?: Editor | null;
  class?: string;  // Vue/Svelte use "class", React uses "className"
}

interface BubbleMenuProps {
  editor?: Editor | null;
  class?: string;
  children?: ...;  // Framework-specific child type
}
```

## State Management Equivalence

| React | Vue | Svelte |
|-------|-----|--------|
| `hooks/` | `composables/` | `runes/` |
| `useVizelEditor` | `useVizelEditor` | `useVizelEditor` |
| `createSlashMenuRenderer` | `createSlashMenuRenderer` | `createSlashMenuRenderer` |

### Options Interface

All must accept identical options (defined in core):

```typescript
// @vizel/core - shared type
interface UseVizelEditorOptions extends VizelEditorOptions {
  extensions?: Extensions;
}
```

### Return Type Equivalence

| React | Vue | Svelte |
|-------|-----|--------|
| `Editor \| null` | `ShallowRef<Editor \| null>` | `{ get current(): Editor \| null }` |

## Context API Equivalence

| Feature | React | Vue | Svelte |
|---------|-------|-----|--------|
| Provider | `EditorProvider` | `provide()` | `setContext()` |
| Consumer | `useEditorContext()` | `inject()` | `getContext()` |
| Safe access | `useEditorContextSafe()` | `useEditorContextSafe()` | `useEditorContextSafe()` |

## Adding New Features

When adding a feature:

1. Add shared logic/types to `@vizel/core`
2. Implement in all three framework packages
3. Ensure props/options are consistent
4. Update all three demo apps
5. Verify with `bun run typecheck && bun run build`
