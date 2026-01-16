# @vizel/core

Framework-agnostic core for Vizel block-based Markdown editor built on Tiptap.

## Installation

```bash
npm install @vizel/core
```

## Overview

This package provides:

- Tiptap extensions for block-based editing
- Type definitions shared across framework packages
- Utility functions for editor configuration
- CSS styles for editor components

## Usage

This package is typically used as a dependency of framework-specific packages:

- `@vizel/react` - React components
- `@vizel/vue` - Vue 3 components
- `@vizel/svelte` - Svelte 5 components

### Direct Usage

```typescript
import { resolveVizelFeatures, createVizelImageUploader } from "@vizel/core";
import type { VizelEditorOptions, VizelFeatureOptions } from "@vizel/core";

// Import styles
import "@vizel/core/styles.css";
```

## Documentation

See the [main repository](https://github.com/seijikohara/vizel) for full documentation.

## License

MIT
