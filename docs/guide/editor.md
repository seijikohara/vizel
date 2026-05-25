# Editor

The editor is the central object in Vizel. Every other concept — blocks,
Markdown, theming, collaboration — flows through a single Tiptap-backed
instance that you create once per visible editor surface.

## The `Vizel` component vs. `useVizelEditor`

Vizel ships two layers on top of Tiptap. Pick the one that matches how
much of the UI you want to own.

| Layer | When to use | What you get |
|-------|-------------|--------------|
| `<Vizel />` | You want a Notion-like surface with toolbar, slash menu, drag handle, and bubble menu turned on by default. | A self-contained component. Slot in your own toolbar or bubble menu when ready to customize. |
| `useVizelEditor` (React, Vue) / `createVizelEditor` (Svelte) | You want to compose your own surface (custom toolbar, multi-pane layout, sidebar outline, ...). | A reactive editor handle plus the building-block components (`VizelEditor`, `VizelToolbar`, `VizelBubbleMenu`, `VizelSlashMenu`, ...). |

The hook / composable / rune signature mirrors across frameworks; only
the reactivity binding differs.

::: code-group

```tsx [React]
import { useVizelEditor, VizelEditor } from "@vizel/react";

function MyEditor() {
  const editor = useVizelEditor({
    initialMarkdown: "# Hello, Vizel",
  });
  return <VizelEditor editor={editor} />;
}
```

```vue [Vue]
<script setup lang="ts">
import { useVizelEditor, VizelEditor } from "@vizel/vue";

const editor = useVizelEditor({
  initialMarkdown: "# Hello, Vizel",
});
</script>

<template>
  <VizelEditor :editor="editor.value" />
</template>
```

```svelte [Svelte]
<script lang="ts">
import { createVizelEditor, VizelEditor } from "@vizel/svelte";

const editor = createVizelEditor({
  initialMarkdown: "# Hello, Vizel",
});
</script>

<VizelEditor editor={editor.current} />
```

:::

## Editor options

The editor accepts a single `VizelEditorOptions` object. The mount-time
contract is identical across the three frameworks.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `initialContent` | `JSONContent` | - | Initial content in Tiptap JSON format |
| `initialMarkdown` | `string` | - | Initial content in Markdown format. Takes precedence over `initialContent` when both are provided |
| `placeholder` | `string` | - | Placeholder text when the editor is empty |
| `editable` | `boolean` | `true` | Whether the editor is editable. Mirrored at runtime through `editor.setEditable()` |
| `autofocus` | `boolean \| "start" \| "end" \| "all" \| number` | `false` | Auto-focus behavior on mount |
| `features` | `VizelFeatureOptions` | See below | Feature toggles and per-feature options |
| `markdown` | `VizelMarkdownOptions` | `{ flavor: vizelGfmFlavor }` | Markdown pipeline configuration. See [Markdown](/guide/markdown) |
| `extensions` | `Extensions` | `[]` | Additional Tiptap extensions |
| `locale` | `VizelLocale` | English | Locale object for translating UI strings |

### Autofocus values

| Value | Behavior |
|-------|----------|
| `false` | No autofocus (default) |
| `true` / `"start"` | Focus at the start of the document |
| `"end"` | Focus at the end of the document |
| `"all"` | Select all content |
| `number` | Focus at the specified position |

### Read-only mode

Set `editable: false` to make the editor read-only, then flip it back at
runtime with `editor.setEditable(true)`:

```ts
const editor = useVizelEditor({
  editable: false,
  initialContent: myContent,
});

// Toggle at runtime
editor.setEditable(true);
const isEditable = editor.isEditable;
```

## Lifecycle callbacks

Vizel exposes the standard Tiptap lifecycle as typed props on the
editor options. The callback name and payload shape are identical
across the three frameworks.

| Callback | Payload | When it fires |
|----------|---------|---------------|
| `onCreate` | `{ editor }` | Editor instance created |
| `onUpdate` | `{ editor }` | Document changed |
| `onSelectionUpdate` | `{ editor }` | Selection moved |
| `onFocus` / `onBlur` | `{ editor }` | Focus state changed |
| `onDestroy` | — | Editor torn down |
| `onError` | `VizelError` | A typed runtime error or warning surfaced through `emitVizelError`. Supplying the callback takes over the failure path; the editor does not also rethrow. Omit it to let global handlers (Sentry, `unhandledrejection`) observe failures. |

## Mount-time vs runtime options

`useVizelEditor` / `createVizelEditor` create the Tiptap instance once.
Most options (`initialContent`, `initialMarkdown`, `features`,
`extensions`, `markdown`, `locale`, `autofocus`) are captured at mount.
The single exception is `editable`, which all three frameworks mirror
through `editor.setEditable()` whenever the prop changes after mount.

To change anything else at runtime, run the corresponding Tiptap
command (`editor.commands.setContent(...)`,
`editor.commands.focus(...)`, ...).

## Features

Most features are enabled by default. Set any feature to `false` to
disable it or pass an options object to configure it.

```ts
const editor = useVizelEditor({
  features: {
    content: {
      // Most features are enabled by default
      table: true,
      image: { onUpload: async (file) => "https://example.com/image.png" },
      // Opt-in: must be explicitly enabled
      wikiLink: true,
    },
    interaction: {
      dragHandle: true,
      slashMenu: true,
      // Opt-in: requires consumer-supplied items
      mention: { items: async (query) => [] },
    },
    collaboration: {
      // Opt-in: comments require a provider
      provider: true,
      comments: true,
    },
  },
});
```

See [Features](/guide/features) for the full catalog and per-feature
options.

## Auto-save

The auto-save hook persists editor content automatically to a storage
backend. The hook is framework-mirrored: React and Vue expose
`useVizelAutoSave`, Svelte exposes `createVizelAutoSave`.

::: code-group

```tsx [React]
import {
  useVizelEditor,
  useVizelAutoSave,
  VizelEditor,
  VizelSaveIndicator,
} from "@vizel/react";

function Editor() {
  const editor = useVizelEditor();
  const { status, lastSaved } = useVizelAutoSave(editor, {
    debounceMs: 2000,
    storage: "localStorage",
    key: "my-editor-content",
  });

  return (
    <div>
      <VizelEditor editor={editor} />
      <VizelSaveIndicator status={status} lastSaved={lastSaved} />
    </div>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { useVizelEditor, useVizelAutoSave } from "@vizel/vue";
import { VizelEditor, VizelSaveIndicator } from "@vizel/vue";

const editor = useVizelEditor();
const { status, lastSaved } = useVizelAutoSave(() => editor.value, {
  debounceMs: 2000,
  storage: "localStorage",
  key: "my-editor-content",
});
</script>

<template>
  <div>
    <VizelEditor :editor="editor" />
    <VizelSaveIndicator :status="status" :lastSaved="lastSaved" />
  </div>
</template>
```

```svelte [Svelte]
<script lang="ts">
import {
  createVizelEditor,
  createVizelAutoSave,
  VizelEditor,
  VizelSaveIndicator,
} from "@vizel/svelte";

const editor = createVizelEditor();
const autoSave = createVizelAutoSave(() => editor.current, {
  debounceMs: 2000,
  storage: "localStorage",
  key: "my-editor-content",
});
</script>

<VizelEditor editor={editor.current} />
<VizelSaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
```

:::

### Auto-save options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable auto-save |
| `debounceMs` | `number` | `1000` | Debounce delay in milliseconds |
| `storage` | `"localStorage" \| "sessionStorage" \| VizelAutoSaveStorage` | `"localStorage"` | Storage backend |
| `key` | `string` | `"vizel-content"` | Storage key |
| `onSave` | `(content) => void` | - | Fires after a successful save |
| `onError` | `(error) => void` | - | Fires on a save error |
| `onRestore` | `(content) => void` | - | Fires when the system restores content |

A custom storage backend must implement both `save` and `load`:

```ts
const { status } = useVizelAutoSave(editor, {
  storage: {
    save: async (content) => {
      await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
    },
    load: async () => {
      const response = await fetch("/api/content");
      if (!response.ok) return null;
      return response.json();
    },
  },
});
```

### Return values

| Property | Type | Description |
|----------|------|-------------|
| `status` | `"saved" \| "saving" \| "unsaved" \| "error"` | Current save status |
| `hasUnsavedChanges` | `boolean` | Whether there are unsaved changes |
| `lastSaved` | `Date \| null` | Timestamp of the last successful save |
| `error` | `Error \| null` | Last error when `status === "error"` |
| `save()` | `() => Promise<void>` | Trigger a save manually |
| `restore()` | `() => Promise<content>` | Restore content manually |

## Editor state

Use the shared state hook to subscribe to editor changes without
hand-rolling listeners. The hook is framework-mirrored.

```tsx
import { useVizelState } from "@vizel/react";

function EditorStatus({ editor }) {
  useVizelState(editor);
  return (
    <div>
      <span>Characters: {editor?.storage.characterCount?.characters() ?? 0}</span>
      <span>Words: {editor?.storage.characterCount?.words() ?? 0}</span>
    </div>
  );
}
```

For one-off reads, call `getVizelEditorState(editor)` directly:

```ts
import { getVizelEditorState } from "@vizel/core";

const state = getVizelEditorState(editor);
// { isFocused, isEmpty, canUndo, canRedo, characterCount, wordCount }
```

## Working with content

Tiptap exposes four serialization formats on every editor instance:

```ts
const json = editor.getJSON();
const markdown = editor.getMarkdown();
const html = editor.getHTML();
const text = editor.getText();

editor.commands.setContent({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "New" }] }],
});
editor.commands.clearContent();
```

Markdown is the source of truth on save and load — see
[Markdown](/guide/markdown) for the parser, serializer, and round-trip
contract.

## Custom Tiptap extensions

Pass additional Tiptap extensions through the `extensions` option:

```ts
import { TextAlign } from "@tiptap/extension-text-align";

const editor = useVizelEditor({
  extensions: [TextAlign.configure({ types: ["heading", "paragraph"] })],
});
```

::: warning Extension conflicts
Disable a built-in feature before swapping in your own version. For
example, set `features.typography: false` before registering a custom
typography extension.
:::

## Try this if you want to ...

- ... use Markdown as the source of truth → [Markdown](/guide/markdown)
- ... reorder, duplicate, or delete whole blocks → [Blocks](/guide/blocks)
- ... render Markdown on the server → [SSR](/guide/ssr)
- ... synchronize the theme with your host UI → [Theming](/guide/theming)
- ... add real-time collaboration, comments, or version history → [Collaboration](/guide/collaboration)
- ... browse every feature toggle → [Features](/guide/features)
