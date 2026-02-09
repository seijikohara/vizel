# Plugin System

Vizel provides a plugin system that lets you extend the editor with custom functionality in a structured and discoverable way.

## Overview

While Vizel supports adding custom [Tiptap extensions](/guide/configuration#extensions) directly, the plugin system provides:

- **Standard interface** for packaging extensions
- **Lifecycle management** (install, uninstall, transaction hooks)
- **Dependency resolution** between plugins
- **Style injection** with automatic cleanup

## Quick Start

### Using a Plugin

```typescript
import { VizelPluginManager } from "@vizel/core";
import { useVizelEditor } from "@vizel/react";
import { myPlugin } from "my-vizel-plugin";

const plugins = new VizelPluginManager();
plugins.register(myPlugin);

// Pass plugin extensions to the editor
const editor = useVizelEditor({
  extensions: plugins.getExtensions(),
});

// Connect the editor to enable lifecycle hooks
plugins.setEditor(editor);
```

### Creating a Plugin

```typescript
import type { VizelPlugin } from "@vizel/core";
import { MyExtension } from "./extension";

export const myPlugin: VizelPlugin = {
  name: "my-vizel-plugin",
  version: "1.0.0",
  description: "Adds cool feature to Vizel",
  extensions: [MyExtension],
  styles: `
    .my-plugin-highlight {
      background: var(--vizel-primary);
      color: white;
    }
  `,
  onInstall: (editor) => {
    console.log("Plugin installed");
  },
  onUninstall: (editor) => {
    console.log("Plugin removed");
  },
};
```

## Plugin Interface

```typescript
interface VizelPlugin {
  /** Unique plugin identifier (kebab-case) */
  name: string;
  /** Plugin version (semver, e.g. "1.0.0") */
  version: string;
  /** Human-readable description */
  description?: string;
  /** Tiptap extensions to add */
  extensions?: Extensions;
  /** CSS styles to inject */
  styles?: string;
  /** Called when plugin is installed */
  onInstall?: (editor: Editor) => void;
  /** Called when plugin is uninstalled */
  onUninstall?: (editor: Editor) => void;
  /** Called on each editor transaction */
  onTransaction?: (props: {
    editor: Editor;
    transaction: Transaction;
  }) => void;
  /** Plugin names that must be registered first */
  dependencies?: string[];
}
```

### Naming Conventions

- Plugin `name` must be kebab-case: `my-plugin`, `vizel-comments`
- Plugin `version` must be valid semver: `1.0.0`, `2.1.0-beta.1`

## Plugin Manager

`VizelPluginManager` handles plugin registration, lifecycle, and extension aggregation.

### Methods

| Method | Description |
|--------|-------------|
| `register(plugin)` | Register a plugin |
| `unregister(name)` | Unregister a plugin by name |
| `setEditor(editor)` | Connect an editor instance |
| `destroy()` | Disconnect editor and clean up all plugins |
| `getExtensions()` | Get aggregated extensions from all plugins |
| `getPlugin(name)` | Get a plugin by name |
| `listPlugins()` | List all registered plugins |
| `hasPlugin(name)` | Check if a plugin is registered |

### Registration Order

Register plugins with dependencies after their dependencies:

```typescript
const plugins = new VizelPluginManager();

// Register base plugin first
plugins.register(basePlugin);

// Then register plugins that depend on it
plugins.register(advancedPlugin); // has dependencies: ["base-plugin"]
```

## Lifecycle Hooks

### `onInstall`

Runs when you connect the editor via `setEditor()`, or immediately if the editor is already connected when you call `register()`.

```typescript
const myPlugin: VizelPlugin = {
  name: "my-plugin",
  version: "1.0.0",
  onInstall: (editor) => {
    // Set up plugin state, register commands, etc.
    editor.commands.setMeta("myPlugin", { initialized: true });
  },
};
```

### `onUninstall`

Runs when you unregister the plugin or call `destroy()`.

```typescript
const myPlugin: VizelPlugin = {
  name: "my-plugin",
  version: "1.0.0",
  onUninstall: (editor) => {
    // Clean up plugin state
  },
};
```

### `onTransaction`

Runs on every editor transaction. Use this for reactive behavior like tracking changes or updating UI.

```typescript
const wordCountPlugin: VizelPlugin = {
  name: "word-count",
  version: "1.0.0",
  onTransaction: ({ editor }) => {
    const text = editor.getText();
    const words = text.split(/\s+/).filter(Boolean).length;
    console.log(`Word count: ${words}`);
  },
};
```

::: warning
`onTransaction` runs frequently. Keep handlers lightweight to avoid performance issues.
:::

## Style Injection

Vizel automatically injects plugin styles into `<head>` and cleans them up on unregistration.

```typescript
const themedPlugin: VizelPlugin = {
  name: "themed-plugin",
  version: "1.0.0",
  styles: `
    .themed-block {
      border: 1px solid var(--vizel-border);
      border-radius: var(--vizel-radius);
      padding: 1rem;
    }
    [data-vizel-theme="dark"] .themed-block {
      background: var(--vizel-muted);
    }
  `,
};
```

Vizel wraps each plugin's styles in a `<style>` element with id `vizel-plugin-style-{name}`, ensuring:

- No duplicate style injection
- Clean removal when you unregister the plugin
- Compatibility with Vizel's theming system

## Dependencies

Plugins can declare dependencies on other plugins. The plugin system:

- Verifies that dependencies are registered before allowing registration
- Resolves dependency order when aggregating extensions via `getExtensions()`
- Prevents you from unregistering plugins that others depend on
- Detects circular dependencies

```typescript
const basePlugin: VizelPlugin = {
  name: "base-plugin",
  version: "1.0.0",
  extensions: [BaseExtension],
};

const advancedPlugin: VizelPlugin = {
  name: "advanced-plugin",
  version: "1.0.0",
  dependencies: ["base-plugin"],
  extensions: [AdvancedExtension],
};

const plugins = new VizelPluginManager();
plugins.register(basePlugin);
plugins.register(advancedPlugin); // OK: base-plugin is registered

// getExtensions() returns [BaseExtension, AdvancedExtension]
// (dependency-first order)
```

## Framework Integration

### React

```tsx
import { VizelPluginManager } from "@vizel/core";
import { useVizelEditor, VizelProvider, VizelEditor } from "@vizel/react";
import { useEffect, useMemo } from "react";

function Editor() {
  const plugins = useMemo(() => {
    const manager = new VizelPluginManager();
    manager.register(myPlugin);
    return manager;
  }, []);

  const editor = useVizelEditor({
    extensions: plugins.getExtensions(),
  });

  useEffect(() => {
    if (editor) plugins.setEditor(editor);
    return () => plugins.destroy();
  }, [editor, plugins]);

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
    </VizelProvider>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { VizelPluginManager } from "@vizel/core";
import { useVizelEditor, VizelProvider, VizelEditor } from "@vizel/vue";
import { onBeforeUnmount, watch } from "vue";

const plugins = new VizelPluginManager();
plugins.register(myPlugin);

const editor = useVizelEditor({
  extensions: plugins.getExtensions(),
});

watch(
  () => editor.value,
  (ed) => {
    if (ed) plugins.setEditor(ed);
  }
);

onBeforeUnmount(() => plugins.destroy());
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
  </VizelProvider>
</template>
```

### Svelte

```svelte
<script lang="ts">
import { VizelPluginManager } from "@vizel/core";
import { createVizelEditor, VizelProvider, VizelEditor } from "@vizel/svelte";

const plugins = new VizelPluginManager();
plugins.register(myPlugin);

const editor = createVizelEditor({
  extensions: plugins.getExtensions(),
});

$effect(() => {
  const ed = editor.current;
  if (ed) plugins.setEditor(ed);
  return () => plugins.destroy();
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
</VizelProvider>
```

## Validation

The plugin system validates each plugin on registration:

| Check | Error |
|-------|-------|
| Missing `name` | `"Vizel plugin must have a name"` |
| Invalid `name` format | `"must be kebab-case"` |
| Missing `version` | `"must have a version"` |
| Invalid `version` format | `"must be valid semver"` |
| Duplicate name | `"is already registered"` |
| Missing dependency | `"requires ... which is not registered"` |
| Circular dependency | `"Circular plugin dependency detected"` |
| Dependent exists on unregister | `"Cannot unregister: plugin ... depends on it"` |
