<script setup>
import VizelDemo from '../.vitepress/components/VizelDemo.vue'
</script>

# Live Demo

Try the Vizel editor below. This is a fully functional editor with all features enabled.

<VizelDemo />

## How to Use

### Slash Commands

Type `/` anywhere in the editor to open the command menu:

- **Text**: Paragraph, Headings (H1-H3), Quote, Code
- **Lists**: Bullet List, Numbered List, Task List
- **Media**: Image, Horizontal Rule, Table
- **Advanced**: Details, Embed, Diagram, Math Block

### Bubble Menu

Select any text to reveal the formatting toolbar:

- **Bold** (`Ctrl/Cmd + B`)
- **Italic** (`Ctrl/Cmd + I`)
- **Underline** (`Ctrl/Cmd + U`)
- **Strikethrough**
- **Code**
- **Link**
- **Text Color / Highlight**

### Drag & Drop

Hover over any block to see the drag handle on the left. Drag to reorder blocks.

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Bold | `Ctrl/Cmd + B` |
| Italic | `Ctrl/Cmd + I` |
| Underline | `Ctrl/Cmd + U` |
| Code | `Ctrl/Cmd + E` |
| Link | `Ctrl/Cmd + K` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` |
| Heading 1 | `Ctrl/Cmd + Alt + 1` |
| Heading 2 | `Ctrl/Cmd + Alt + 2` |
| Heading 3 | `Ctrl/Cmd + Alt + 3` |

## Framework Support

This demo uses the Vue implementation, but Vizel provides identical functionality for:

- **React 19** - `@vizel/react`
- **Vue 3** - `@vizel/vue`
- **Svelte 5** - `@vizel/svelte`

All frameworks share the same core extensions and features from `@vizel/core`.
