# Blocks

Vizel treats every paragraph, heading, list item, table cell, and
custom node as a block. Blocks are the unit of selection, drag, copy,
and undo. The block primitives ship as always-on core: you do not
need to enable a feature toggle to use them.

## Block-aware editing extensions

| Extension | Always on? | What it does |
|-----------|-----------|---------------|
| `MultiBlockSelection` | Yes | Range selection across multiple blocks with block-aware `Backspace` / `Delete` / `Tab` / `Shift+Tab` |
| `BlockClipboard` | Yes | Block-aware copy / cut / paste that writes `application/x-vizel-blocks` (lossless JSON), plus `text/html`, `text/markdown`, and `text/plain` mirrors |
| `DragHandle` | Opt-in via `features.interaction.dragHandle` | Per-item drag handle for blocks and list items at any nesting depth |
| `BlockMenu` | Renders from any drag handle | Delete, duplicate, turn into another block type |

Because clipboard and selection are always on, every editor instance
supports keyboard reorder (`Alt+Up` / `Alt+Down`) and lossless paste
between two Vizel editors out of the box.

## Block operations from your code

Vizel exposes a typed `VizelCommand` layer that lets you trigger the
same operation that the slash menu, block menu, and toolbar use.

| Command | Behavior |
|---------|----------|
| `deleteBlock` | Remove the current block |
| `duplicateBlock` | Insert a clone right after the current block |
| `turnInto(nodeType)` | Convert the current block to the given node type |
| `moveBlockUp` / `moveBlockDown` | Reorder the current block within its parent |

These commands appear automatically in the block menu when the drag
handle is enabled. To bind them to your own button, dispatch the
underlying Tiptap chain:

::: code-group

```tsx [React]
<button onClick={() => editor?.chain().focus().duplicateBlock().run()}>
  Duplicate
</button>
```

```vue [Vue]
<button @click="editor?.chain().focus().duplicateBlock().run()">
  Duplicate
</button>
```

```svelte [Svelte]
<button onclick={() => editor.current?.chain().focus().duplicateBlock().run()}>
  Duplicate
</button>
```

:::

## Clipboard payloads

`BlockClipboard` writes four MIME types on every copy:

| MIME type | Purpose |
|-----------|---------|
| `application/x-vizel-blocks` | Lossless JSON. A Vizel editor that recognizes the marker rehydrates the exact node tree. |
| `text/markdown` | Markdown serialization through the active flavor. Falls back to encoding modes (see [Markdown](/guide/markdown)). |
| `text/html` | HTML serialization. Useful for pasting into rich-text email clients. |
| `text/plain` | Plain-text fallback. |

On paste, Vizel prefers `application/x-vizel-blocks` when both editors
are on the same version. Cross-editor or cross-app paste falls back to
Markdown, then HTML, then plain text.

## Try this if you want to ...

- ... persist or transmit document state → [Markdown](/guide/markdown)
- ... add a custom block type → [Editor: Custom Tiptap extensions](/guide/editor#custom-tiptap-extensions)
- ... customize the slash menu → [Editor: Features](/guide/editor#features)
- ... add comments or version history → [Collaboration](/guide/collaboration)
