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
| `onError` | `VizelError` | A typed runtime error or warning surfaced through `emitVizelError` |

## Mount-time vs runtime options

`useVizelEditor` / `createVizelEditor` create the Tiptap instance once.
Most options (`initialContent`, `initialMarkdown`, `features`,
`extensions`, `flavor`, `locale`, `autofocus`) are captured at mount.
The single exception is `editable`, which all three frameworks mirror
through `editor.setEditable()` whenever the prop changes after mount.

To change anything else at runtime, run the corresponding Tiptap
command (`editor.commands.setContent(...)`,
`editor.commands.focus(...)`, ...).

## Try this if you want to ...

- ... use Markdown as the source of truth → [Markdown](/guide/markdown)
- ... reorder, duplicate, or delete whole blocks → [Blocks](/guide/blocks)
- ... render Markdown on the server → [SSR](/guide/ssr)
- ... synchronize the theme with your host UI → [Theming](/guide/theming)
- ... add real-time collaboration → [Collaboration](/guide/collaboration)
