# Section 12 — SSR / Static Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Vizel's three SSR modes — `VizelStaticView` (read-only full SSR), `Vizel` with progressive enhancement, and `Vizel` with client-only mount — plus the supporting Core helpers (`generateVizelStaticHtml`, `vizelThemeInitScript`), an `SSR_NOT_SUPPORTED` guard at the editor factory, and a `scripts/check-ssr-safety.ts` lint script.

**Architecture:** All server-callable code lives in `@vizel/core` and never touches `document` / `window` at module-top scope. The editor factory throws when called on the server. Framework packages add a thin `VizelStaticView` component plus rendering guidance. CI enforces SSR safety via a new script.

**Tech Stack:** Tiptap v3, prosemirror-markdown, framework-agnostic HTML serialization, ES modules. The static-view HTML is sanitized through DOMPurify (already a `@vizel/core` dependency) before it reaches a framework renderer.

---

## Already-shipped infrastructure

- `SSR_NOT_SUPPORTED` is already in the `VizelErrorCode` union (Section 7).
- `controllers/` and `extensions/` already follow SSR-safe rules per Section 1.
- `tiptap-markdown` (Section 10b) provides the markdown -> JSON path used by `generateVizelStaticHtml`.

---

## Sub-PR breakdown

The work splits into two PRs:

- **12a — Core SSR helpers + factory guard + CI script.** Ship
  `generateVizelStaticHtml`, `vizelThemeInitScript`, the
  `createVizelEditorInstance` SSR guard, and
  `scripts/check-ssr-safety.ts`. Append an "SSR Safety" section to
  `.claude/rules/packages/core.md`.

- **12b — `VizelStaticView` x 3 framework + per-framework SSR
  guidance.** Ship the React / Vue / Svelte `VizelStaticView`
  components, update cross-framework parity tables, and add SSR
  pattern sections to
  `.claude/rules/packages/{react,vue,svelte}.md`.

---

## Spec mapping (binding)

```ts
export interface VizelStaticHtmlOptions {
  readonly flavor?: VizelMarkdownFlavor;
  readonly theme?: "light" | "dark";
  readonly className?: string;
}

export interface VizelStaticHtmlInput {
  /** Pre-parsed Tiptap JSON content. Mutually exclusive with `markdown`. */
  readonly content?: JSONContent;
  /** Source markdown text. Mutually exclusive with `content`. */
  readonly markdown?: string;
}

export function generateVizelStaticHtml(
  input: VizelStaticHtmlInput,
  options?: VizelStaticHtmlOptions
): string;

export interface VizelThemeInitScriptOptions {
  readonly defaultTheme?: "light" | "dark" | "system";
  readonly storageKey?: string;
}

export function vizelThemeInitScript(options?: VizelThemeInitScriptOptions): string;
```

`createVizelEditorInstance` throws when `typeof document === "undefined"`:

```ts
if (typeof document === "undefined") {
  throw new VizelError(
    "SSR_NOT_SUPPORTED",
    "createVizelEditorInstance cannot be called during SSR. " +
      "Defer creation to a client lifecycle hook."
  );
}
```

`VizelStaticView` (all three frameworks):

```tsx
<VizelStaticView markdown={mdString} flavor={vizelGfmFlavor} theme="dark" />
<VizelStaticView content={jsonContent} className="prose" />
```

---

## Task 12a-1: `generateVizelStaticHtml`

**Files:**
- Create: `packages/core/src/utils/ssr.ts`
- Modify: `packages/core/src/utils/index.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1:** Implement the helper. Approach:
  - When `input.markdown` is supplied, parse it via the Tiptap schema.
  - When `input.content` is supplied, use it directly.
  - Walk the resulting node tree producing an HTML string. Use
    `getHTMLFromFragment` (from `@tiptap/core`) over a `Schema` built
    from `createBaseExtensions()` for the schema surface.
  - Sanitize the HTML through DOMPurify before returning so that
    consumer-supplied markdown cannot inject unsafe markup into the
    rendered output.
  - Wrap the sanitized HTML in
    `<div class="vizel-root vizel-static-view${className ? ` ${className}` : ""}" data-vizel-root data-vizel-static-view${theme ? ` data-vizel-theme="${theme}"` : ""}>...</div>`.
  - For diagram nodes (Mermaid, GraphViz), emit a `<pre><code
    class="language-mermaid|graphviz">{source}</code></pre>` fallback so the
    server output stays JavaScript-free; client hydration upgrades these.

- [ ] **Step 2:** SSR-safe — must never touch `document` / `window`.
  Build the schema with no DOM dependencies. Avoid extensions that
  require browser globals (drag handle, image upload, etc.) — only
  load schema-defining nodes/marks.

- [ ] **Step 3:** Verify with a unit-style test harness (TS run
  via `tsx` from `scripts/`) — emit HTML for a few representative
  markdown samples and assert structure.

## Task 12a-2: `vizelThemeInitScript`

**Files:**
- Modify: `packages/core/src/utils/ssr.ts` (add the helper)
- Modify: `packages/core/src/utils/index.ts` (export)
- Modify: `packages/core/src/index.ts` (export)

- [ ] **Step 1:** Return a string containing:

```js
(function(){
  var key = "<storageKey>";
  var preferred = window.localStorage.getItem(key) || "<defaultTheme>";
  var theme = preferred;
  if (theme === "system") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-vizel-theme", theme);
})();
```

Templated with the consumer's `defaultTheme` / `storageKey`. Consumers
embed via `<script>{vizelThemeInitScript()}</script>` in their `<head>`.

- [ ] **Step 2:** Document that the script runs synchronously to avoid
  the dark-mode flash; it sets the attribute on `document.documentElement`
  intentionally (matches Section 13's policy: the theme attribute lives
  on the root element so descendants inherit it via CSS).

## Task 12a-3: `createVizelEditorInstance` SSR guard

**Files:**
- Modify: `packages/core/src/utils/editorFactory.ts`

- [ ] **Step 1:** At the top of `createVizelEditorInstance`, before any
  option destructuring, add:

```ts
if (typeof document === "undefined") {
  throw createVizelError(
    "SSR_NOT_SUPPORTED",
    "createVizelEditorInstance cannot be called during SSR. " +
      "Defer creation to a client lifecycle hook."
  );
}
```

- [ ] **Step 2:** Verify the throw path with a quick `tsx` script that
  imports the factory inside a `typeof document === "undefined"`
  context and asserts the throw.

## Task 12a-4: `scripts/check-ssr-safety.ts`

**Files:**
- Create: `scripts/check-ssr-safety.ts`
- Modify: `package.json` (add `check:ssr` npm script)

- [ ] **Step 1:** Walk `packages/core/src/{utils,builders,commands}/`
  looking for top-level (module-scope) `document.` or `window.`
  references. Allow references inside function bodies that begin with
  an SSR guard (`typeof document === "undefined"` early-return).
  Report any violation with file + line and exit non-zero.

- [ ] **Step 2:** Wire it into `pnpm` scripts as
  `"check:ssr": "tsx scripts/check-ssr-safety.ts"`.

- [ ] **Step 3:** Run it locally — if existing code violates the rule,
  fix the violations in this same PR (they should be rare; Sections 1
  and 7 already enforce most of the surface).

## Task 12a-5: `.claude/rules/packages/core.md` SSR Safety section

**Files:**
- Modify: `.claude/rules/packages/core.md`

- [ ] **Step 1:** Append an "SSR Safety" section. Document:
  - The "Layer-by-layer SSR safety" table from the spec.
  - The `SSR_NOT_SUPPORTED` throw at the factory.
  - The `generateVizelStaticHtml` helper for server rendering.
  - The `vizelThemeInitScript` helper for pre-hydration theme.
  - The CI script `pnpm check:ssr` that flags violations.
  - The DOMPurify sanitization step the helper applies.

## Task 12a-6: Verification

- [ ] `pnpm exec biome check --write` — auto-fix
- [ ] `pnpm typecheck` — clean
- [ ] `pnpm build` — clean
- [ ] `pnpm check:parity` — passes
- [ ] `pnpm check:ssr` — passes
- [ ] Commit and open PR 12a.

---

## Task 12b: `VizelStaticView` x 3 framework

**Files (all new):**
- `packages/react/src/components/VizelStaticView.tsx`
- `packages/vue/src/components/VizelStaticView.vue`
- `packages/svelte/src/components/VizelStaticView.svelte`
- Re-export from each framework's `src/components/index.ts` and `src/index.ts`
- Modify: `.claude/rules/cross-framework.md` Tables 2 and 3
- Modify: `.claude/rules/packages/{react,vue,svelte}.md` SSR pattern sections
- Tests: `tests/ct/scenarios/static-view.scenario.ts` + per-framework specs

### Component shape

```tsx
export interface VizelStaticViewProps {
  /** Source markdown text. Mutually exclusive with `content`. */
  readonly markdown?: string;
  /** Pre-parsed JSON content. Mutually exclusive with `markdown`. */
  readonly content?: JSONContent;
  /** Markdown flavor used to parse `markdown`. Defaults to `vizelGfmFlavor`. */
  readonly flavor?: VizelMarkdownFlavor;
  /** Locks the rendered theme; defaults to inheriting the host theme. */
  readonly theme?: "light" | "dark";
  /** Additional class name appended to `.vizel-static-view`. */
  readonly className?: string; // `class` in Vue / Svelte
}
```

The component calls `generateVizelStaticHtml(input, options)` which
already returns sanitized HTML. The framework then injects that HTML
via the framework's native raw-html escape hatch (React
`dangerouslySetInnerHTML`, Vue `v-html`, Svelte `{@html}`). Because
the string the consumer sees has already been routed through DOMPurify
inside Core, the framework layer never accepts arbitrary HTML directly.
Output is read-only — no editor instance, no contenteditable.

### Tests

`tests/ct/scenarios/static-view.scenario.ts`:

- Mount with `markdown="# Hello\n\nWorld"` — assert the heading and
  paragraph render with the right tags and classes.
- Mount with `theme="dark"` — assert `data-vizel-theme="dark"`
  appears on the wrapper.
- Mount with `content={...JSON...}` — assert the JSON content renders.
- Mount with `markdown="<script>alert(1)</script>"` — assert no
  script tag survives (regression test for the sanitization step).

### Verification

- [ ] `pnpm exec biome check --write && pnpm typecheck && pnpm build && pnpm check:parity && pnpm check:ssr`
- [ ] Cross-framework parity tables updated
- [ ] Per-framework rule docs updated
- [ ] Commit and open PR 12b

---

## Out of scope (deferred)

- The Mermaid/GraphViz hydration upgrade path (client-side rewrite of
  the server fallback `<pre><code>` into rendered diagrams) belongs to
  a follow-up under Section 16 (demo overhaul) since it touches demo
  app integration.
- Per-Next/Nuxt/SvelteKit example apps live under Section 16.
