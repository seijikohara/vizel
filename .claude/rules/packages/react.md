---
paths:
  - "packages/react/**/*.{ts,tsx}"
---

# `@vizel/react` Package

`@vizel/react` provides React 19 components and hooks. The package wraps `@vizel/core` and adds React-specific code only.

See `cross-framework.md` for component, hook, and props parity requirements.

## Component Structure

React 19 treats `ref` as a regular prop. Do not use `forwardRef`.

```typescript
import { useImperativeHandle } from "react";

export interface ComponentProps {
  ref?: React.Ref<RefType>;
  // additional props
}

export function Component({ ref, ...props }: ComponentProps) {
  useImperativeHandle(ref, () => ({
    // exposed methods
  }));

  // implementation
}
```

## Props

- Use `className` for CSS class names.
- Use the `on*` prefix for event handler props.
- Export the props type alongside the component.

```typescript
export interface BubbleMenuProps {
  editor: Editor;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}
```

## Hooks

### `useVizelEditor`

`useVizelEditor` is the primary hook for creating an editor instance.

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

- Prefix the function name with `use`.
- Return a single value or a single object.
- Handle cleanup inside `useEffect`.
- Use `null` for the uninitialized state, never `undefined`.

## Context

- `VizelProvider` exposes the editor instance to descendants.
- Consumers call `useVizelContext()` for required access.
- Consumers call `useVizelContextSafe()` for optional access.

## Testing

- Test against React 19.
- Verify SSR compatibility.
- Verify keyboard navigation.
