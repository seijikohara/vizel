---
paths: packages/react/**/*.{ts,tsx}
---

# @vizel/react Package Guidelines

## Package Purpose

React 18/19 components and hooks for Vizel editor:

- React components (EditorContent, BubbleMenu, SlashMenu)
- Custom hooks (useVizelEditor)
- Context providers

## Component Development

### Component Structure

```typescript
// Component file structure
import { forwardRef, useImperativeHandle } from "react";
import type { ComponentProps } from "./types";

export interface ComponentProps {
  // Props definition
}

export const Component = forwardRef<RefType, ComponentProps>((props, ref) => {
  // Implementation
});

Component.displayName = "Component";
```

### Props Naming

- Use `className` for CSS class names
- Use `on*` prefix for event handlers
- Export props types with component name

```typescript
export interface BubbleMenuProps {
  editor: Editor;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}
```

## Hooks

### useVizelEditor

Primary hook for creating editor instances.

```typescript
const editor = useVizelEditor({
  initialContent,
  placeholder,
  features: {
    image: { onUpload: uploadFn },
  },
  onUpdate: ({ editor }) => {},
});
```

### Hook Conventions

- Prefix with `use`
- Return single value or object
- Handle cleanup in useEffect
- Use `null` for uninitialized state (not `undefined`)

## Context

### EditorContext

- Provides editor instance to child components
- Use `useEditorContext()` to access
- Use `useEditorContextSafe()` for optional access

## Re-exports from Core

- Re-export all core extensions
- Re-export all core types
- Maintain alphabetical order

```typescript
export {
  Blockquote,
  Bold,
  createVizelExtensions,
  type VizelExtensionsOptions,
} from "@vizel/core";
```

## Testing

- Test with React 18 and 19
- Verify SSR compatibility
- Test keyboard navigation
