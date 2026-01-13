---
paths: packages/react/**/*.{ts,tsx}
---

# @vizel/react Package Guidelines

See `cross-framework.md` for component/hook equivalence requirements.

## Package Purpose

React 19 components and hooks for Vizel editor.
This package only contains React-specific wrappers around `@vizel/core`.

## Component Development

### Component Structure

React 19 no longer requires `forwardRef` - use `ref` as a regular prop:

```typescript
// Component file structure
import { useImperativeHandle } from "react";

export interface ComponentProps {
  ref?: React.Ref<RefType>;
  // Props definition
}

export function Component({ ref, ...props }: ComponentProps) {
  useImperativeHandle(ref, () => ({
    // Exposed methods
  }));
  
  // Implementation
}
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

### VizelContext

- Provides editor instance to child components
- Use `useVizelContext()` to access
- Use `useVizelContextSafe()` for optional access

## Testing

- Test with React 19
- Verify SSR compatibility
- Test keyboard navigation
