# Accessibility

Vizel builds on Tiptap and ProseMirror, which provide a solid foundation for accessible rich text editing. This guide covers keyboard navigation, screen reader support, and best practices for building accessible applications with Vizel.

::: info Note
Vizel has not undergone a formal accessibility audit. The information below describes built-in capabilities and recommended practices but does not constitute a WCAG conformance claim.
:::

## Keyboard Navigation

### Text Formatting

| Shortcut | Action |
|----------|--------|
| `Mod-b` | Bold |
| `Mod-i` | Italic |
| `Mod-u` | Underline |
| `Mod-Shift-s` | Strikethrough |
| `Mod-e` | Inline code |

::: tip
`Mod` refers to `Ctrl` on Windows/Linux and `Cmd` on macOS.
:::

### Block Elements

| Shortcut | Action |
|----------|--------|
| `Mod-Alt-1` through `Mod-Alt-3` | Heading levels 1–3 |
| `Mod-Shift-b` | Blockquote |
| `Tab` / `Shift-Tab` | Indent / outdent list items |
| `Enter` | New paragraph or continue list |
| `Shift-Enter` / `Mod-Enter` | Hard line break |
| `---` + `Enter` | Horizontal rule |

### History

| Shortcut | Action |
|----------|--------|
| `Mod-z` | Undo |
| `Mod-Shift-z` | Redo |
| `Mod-y` | Redo (Windows alternative) |

### Find & Replace

| Shortcut | Action |
|----------|--------|
| `Mod-f` | Open Find |
| `Mod-Shift-h` | Open Find & Replace |
| `Enter` | Next match (when Find panel is open) |
| `Shift-Enter` | Previous match |
| `Escape` | Close Find panel |

### Block Reordering (Drag Handle)

| Shortcut | Action |
|----------|--------|
| `Alt-ArrowUp` | Move block up |
| `Alt-ArrowDown` | Move block down |

### Table Navigation

| Shortcut | Action |
|----------|--------|
| `Tab` | Next cell |
| `Shift-Tab` | Previous cell |
| Arrow keys | Navigate between cells |

### Slash Menu

| Shortcut | Action |
|----------|--------|
| `/` | Open slash command menu |
| `ArrowUp` / `ArrowDown` | Navigate menu items |
| `Enter` | Select item |
| `Escape` | Close menu |
| Type to filter | Filter menu items |

### General Navigation

| Shortcut | Action |
|----------|--------|
| `ArrowUp` / `ArrowDown` | Move between blocks |
| `Home` / `End` | Start / end of line |
| `Mod-Home` / `Mod-End` | Start / end of document |
| `Mod-a` | Select all |

---

## Screen Reader Support

### ARIA Attributes

Vizel's editor element uses the `contenteditable` attribute, which modern screen readers recognize as an editable region. To improve screen reader support, set ARIA attributes via `editorProps`:

```typescript
const editor = useVizelEditor({
  // Set ARIA attributes on the editor element
  editorProps: {
    attributes: {
      role: 'textbox',
      'aria-multiline': 'true',
      'aria-label': 'Document editor',
    },
  },
});
```

Recommended ARIA attributes:

- `role="textbox"` — Identifies the editor as a text input region
- `aria-multiline="true"` — Indicates that the editor supports multi-line editing
- `aria-label` — Provides an accessible name for the editor

### Live Regions

For dynamic content like save indicators and slash menu results, use ARIA live regions:

```tsx
// Save indicator with live region
<div aria-live="polite" aria-atomic="true">
  {status === 'saved' && 'Content saved'}
  {status === 'saving' && 'Saving...'}
  {status === 'error' && 'Save failed'}
</div>
```

### Announcing Content Changes

When you programmatically update content, announce changes to screen readers:

```typescript
function announceChange(message: string) {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.className = 'sr-only';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// Usage
editor.commands.setContent(newContent);
announceChange('Document content updated');
```

---

## Focus Management

### Editor Focus

You can focus the editor programmatically:

```typescript
// Focus at the end of the document
editor.commands.focus('end');

// Focus at the start
editor.commands.focus('start');

// Focus at a specific position
editor.commands.focus(42);
```

### Skip Navigation

You can add a skip link before the editor for keyboard users:

```html
<a href="#editor-content" class="sr-only focus:not-sr-only">
  Skip to editor
</a>

<!-- Other toolbar/navigation content -->

<div id="editor-content">
  <VizelEditor editor={editor} />
</div>
```

### Focus Trap Considerations

Vizel does **not** trap focus. You can `Tab` out of the editor to reach other page elements. If your application wraps the editor in a modal or dialog, implement focus trapping at the dialog level, not the editor level.

---

## High Contrast Mode

### CSS Custom Properties

Vizel uses CSS custom properties for all colors, which makes it compatible with high contrast modes. You can override these variables to adjust contrast:

```css
/* High contrast overrides */
@media (prefers-contrast: more) {
  :root {
    --vizel-border: #000000;
    --vizel-foreground: #000000;
    --vizel-background: #ffffff;
    --vizel-primary: #0000ff;
    --vizel-ring: #0000ff;
    --vizel-border-focus: #0000ff;
  }
}
```

### Focus Indicators

Vizel provides default focus styles, but you can enhance them to ensure visible focus indicators:

```css
/* Enhanced focus indicators */
.vizel-editor:focus-within {
  outline: 3px solid var(--vizel-ring, #3b82f6);
  outline-offset: 2px;
}

/* Ensure bubble menu buttons show focus */
.vizel-bubble-menu button:focus-visible {
  outline: 2px solid var(--vizel-ring, #3b82f6);
  outline-offset: 1px;
}
```

### Dark Mode

Vizel supports dark mode through CSS custom properties. See [Theming](/guide/theming) for configuration details.

---

## Custom Component Guidelines

When you build custom components that interact with Vizel, follow these accessibility guidelines.

### Toolbar Buttons

```tsx
<button
  type="button"
  role="button"
  aria-pressed={editor.isActive('bold')}
  aria-label="Bold"
  title="Bold (Ctrl+B)"
  onClick={() => editor.chain().focus().toggleBold().run()}
>
  <BoldIcon aria-hidden="true" />
</button>
```

Key attributes:
- `aria-pressed` — Reflects the toggle state for formatting buttons
- `aria-label` — Provides an accessible name when the button contains only an icon
- `title` — Shows the keyboard shortcut on hover

### Dropdown Menus

```tsx
<div role="listbox" aria-label="Text formatting options">
  {items.map((item, index) => (
    <div
      key={item.id}
      role="option"
      aria-selected={index === selectedIndex}
      tabIndex={index === selectedIndex ? 0 : -1}
    >
      {item.label}
    </div>
  ))}
</div>
```

### Color Pickers

```tsx
<div role="radiogroup" aria-label="Text color">
  {colors.map((color) => (
    <button
      key={color.value}
      role="radio"
      aria-checked={currentColor === color.value}
      aria-label={color.name}
      style={{ backgroundColor: color.value }}
    />
  ))}
</div>
```

---

## Testing Accessibility

### Manual Testing Checklist

- [ ] **Keyboard only** — Navigate, edit, and format content using only the keyboard
- [ ] **Screen reader** — Test with VoiceOver (macOS), NVDA (Windows), or Orca (Linux)
- [ ] **Zoom** — Verify the editor is usable at 200% zoom
- [ ] **High contrast** — Test with the OS high-contrast mode enabled
- [ ] **Reduced motion** — Verify that animations respect `prefers-reduced-motion`
- [ ] **Color contrast** — Confirm that text and interactive elements meet 4.5:1 contrast ratio

### Reduced Motion

Respect the user's reduced motion preference:

```css
@media (prefers-reduced-motion: reduce) {
  .vizel-editor *,
  .vizel-bubble-menu,
  .vizel-slash-menu {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Automated Tools

You can use automated accessibility testing tools alongside manual testing:

- [axe-core](https://github.com/dequelabs/axe-core) — Automated accessibility testing engine
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/accessibility/) — Chrome DevTools accessibility audit
- [WAVE](https://wave.webaim.org/) — Web accessibility evaluation tool

```bash
# Example: Run axe-core in Playwright tests
npm install @axe-core/playwright

# In your test file
import AxeBuilder from '@axe-core/playwright';

test('editor has no accessibility violations', async ({ page }) => {
  await page.goto('/editor');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Next Steps

- [Theming](/guide/theming) - Customize colors and visual styles
- [Configuration](/guide/configuration) - Editor options reference
- [Troubleshooting](/guide/troubleshooting) - Common issues and solutions
