# API Reference

## Overview

Vizel provides a consistent API across all supported frameworks. The core package contains framework-agnostic extensions and utilities, while the framework-specific packages provide components and state management primitives.

## Packages

- [@vizel/core](/api/core) - Core extensions and utilities
- [@vizel/react](/api/react) - React components and hooks
- [@vizel/vue](/api/vue) - Vue components and composables
- [@vizel/svelte](/api/svelte) - Svelte components and runes

## Architecture

```mermaid
graph TB
    subgraph core["@vizel/core"]
        Extensions["Extensions<br/>(Tiptap extensions)"]
        Types["Types<br/>(shared type definitions)"]
        Utils["Utils<br/>(helper functions)"]
        Styles["Styles<br/>(CSS)"]
    end

    subgraph react["@vizel/react"]
        ReactComponents["Components"]
        ReactHooks["Hooks"]
    end

    subgraph vue["@vizel/vue"]
        VueComponents["Components"]
        VueComposables["Composables"]
    end

    subgraph svelte["@vizel/svelte"]
        SvelteComponents["Components"]
        SvelteRunes["Runes"]
    end

    core --> react
    core --> vue
    core --> svelte
```
