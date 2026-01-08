# Type Definitions

Complete TypeScript type reference for Vizel.

## Overview

Vizel provides comprehensive TypeScript types organized into the following categories:

| Category | Description |
|----------|-------------|
| [Editor Types](./editor) | Core editor options, content, and state types |
| [Feature Options](./features) | Configuration types for all editor features |

## Quick Reference

### Most Used Types

```typescript
// Vizel types from @vizel/core
import type {
  // Editor
  VizelEditorOptions,
  VizelEditorState,
  
  // Features
  VizelFeatureOptions,
  
  // Auto-Save
  VizelAutoSaveOptions,
  VizelSaveStatus,
  
  // Theme
  VizelTheme,
  VizelResolvedTheme,
} from '@vizel/core';

// Tiptap types from @tiptap/core
import type { JSONContent } from '@tiptap/core';
```

### Example Usage

```typescript
import type { VizelEditorOptions } from '@vizel/core';
import type { JSONContent } from '@tiptap/core';

const options: VizelEditorOptions = {
  initialContent: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }
    ],
  },
  features: {
    slashCommand: true,
    markdown: true,
    dragHandle: true,
  },
  onUpdate: ({ editor }) => {
    const content: JSONContent = editor.getJSON();
    console.log(content);
  },
};
```

## Next Steps

- [Editor Types](./editor) - VizelEditorOptions, JSONContent, VizelEditorState
- [Feature Options](./features) - All feature configuration types
