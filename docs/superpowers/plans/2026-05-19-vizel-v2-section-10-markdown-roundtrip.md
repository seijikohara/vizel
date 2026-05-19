# Section 10 — Markdown Round-Trip Guarantee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `@tiptap/markdown` (marked-based) with `tiptap-markdown` (markdown-it-based), promote `VizelMarkdownFlavor` from a string union to a first-class plugin object type, ship five built-in flavors (`commonmark`, `gfm`, `obsidian`, `docusaurus`, `pandoc`), enforce parse-tolerant / serialize-strict policy with `VizelError("MARKDOWN_LOSSY")` reporting, and provide a round-trip test helper.

**Architecture:** All changes live in `@vizel/core`. The library swap touches `extensions/markdown.ts` and any util that calls into the markdown extension; the flavor system lives in `markdown/flavors/`; the round-trip helper lives in `utils/`. Framework packages are pure consumers — they receive the new `markdown` option through `VizelEditorOptions` only.

**Tech Stack:** `tiptap-markdown` (markdown-it base), `markdown-it` plugin ecosystem (`markdown-it-footnote`, `markdown-it-deflist`, `markdown-it-mark`, `markdown-it-task-lists`, etc.).

---

## Sub-PR breakdown

The work splits into four PRs sized for one focused review each:

- **10a — Library swap + plugin-type flavor.** Replace `@tiptap/markdown` with `tiptap-markdown`. Promote `VizelMarkdownFlavor` from a string union to an object type (`name`, `markdownItPlugins`, `nodeSerializers`, `markSerializers`, `config`). Ship the new `commonmark` and `gfm` built-in flavors and `composeVizelMarkdownFlavors` helper.

- **10b — Remaining flavors + module augmentation.** Ship `obsidian`, `docusaurus`, `pandoc` flavors. Augment `Editor` with the always-on `getMarkdown()` and `markdown.parse(md)` methods declared in the spec; remove the runtime capability checks (`hasMarkdownExport`, `hasMarkdownStorage`) and the `as Parameters<...>` cast in `utils/markdown.ts`.

- **10c — `markdown` option + lossy-node encoding + MARKDOWN_LOSSY error.** Add the `markdown: { flavor, encoding }` option to `VizelEditorOptions`. Implement per-node encoding modes (`embed`, `mention`, `wikiLink`) and emit `VizelError("MARKDOWN_LOSSY")` via `onError` when a node cannot serialize.

- **10d — Round-trip helper + .claude docs.** Ship `assertMarkdownRoundtrip(flavor, samples)`. Append a "Markdown Pipeline" section to `.claude/rules/packages/core.md`.

The full Playwright round-trip test suite (100+ samples × 5 flavors) is deferred to its own follow-up under Section 14 (Playwright CT audit).

---

## Spec mapping (binding)

```ts
export interface VizelMarkdownFlavor {
  readonly name: string;
  readonly markdownItPlugins?: readonly ((md: MarkdownIt) => void)[];
  readonly nodeSerializers?: Readonly<Record<string, VizelNodeSerializer>>;
  readonly markSerializers?: Readonly<Record<string, VizelMarkSerializer>>;
  readonly config?: Readonly<Record<string, unknown>>;
}

export const vizelCommonMarkFlavor: VizelMarkdownFlavor;
export const vizelGfmFlavor: VizelMarkdownFlavor;
export const vizelObsidianFlavor: VizelMarkdownFlavor;
export const vizelDocusaurusFlavor: VizelMarkdownFlavor;
export const vizelPandocFlavor: VizelMarkdownFlavor;

export function composeVizelMarkdownFlavors(
  flavors: readonly VizelMarkdownFlavor[],
  name?: string
): VizelMarkdownFlavor;

export function assertMarkdownRoundtrip(
  flavor: VizelMarkdownFlavor,
  samples: readonly { name: string; input: string }[]
): void;
```

`VizelEditorOptions` gains:

```ts
markdown?: {
  flavor?: VizelMarkdownFlavor;
  encoding?: {
    embed?: "link" | "metadata-comment";
    mention?: "plain" | "metadata-comment";
    wikiLink?: "obsidian" | "link";
  };
};
```

Module augmentation:

```ts
declare module "@tiptap/core" {
  interface Editor {
    getMarkdown(): string;
    markdown: { parse(md: string): JSONContent };
  }
}
```

---

## Task 10a-1: Swap markdown library

**Files:**
- Modify: `packages/core/package.json` (remove `@tiptap/markdown`, add `tiptap-markdown`, `markdown-it`, `@types/markdown-it`)
- Modify: `packages/core/src/extensions/markdown.ts` (re-import from `tiptap-markdown`)
- Modify: every call site that uses `MarkdownExtensionOptions`, `getMarkdown`, or `markdown.parse`

- [ ] **Step 1:** `pnpm remove @tiptap/markdown -F @vizel/core`
- [ ] **Step 2:** `pnpm add tiptap-markdown markdown-it -F @vizel/core` and `pnpm add -D @types/markdown-it -F @vizel/core`
- [ ] **Step 3:** Rewrite `extensions/markdown.ts` against `tiptap-markdown`. Its `Markdown` extension accepts an options object with `html`, `tightLists`, `bulletListMarker`, `linkify`, `breaks`, `transformPastedText`, `transformCopiedText` keys.
- [ ] **Step 4:** Update `utils/markdown.ts`. The new extension exposes the storage at `editor.storage.markdown` with a `getMarkdown()` helper.
- [ ] **Step 5:** Run `pnpm check && pnpm typecheck && pnpm build && pnpm test:ct:react` to catch regressions.
- [ ] **Step 6:** Commit and open PR 10a after 10a-2 and 10a-3 land.

## Task 10a-2: Promote VizelMarkdownFlavor to a plugin object type

**Files:**
- Modify: `packages/core/src/utils/markdown-flavors.ts` → split into:
  - `packages/core/src/markdown/types.ts` (new types)
  - `packages/core/src/markdown/flavors/commonmark.ts`
  - `packages/core/src/markdown/flavors/gfm.ts`
  - `packages/core/src/markdown/flavors/compose.ts`
- Modify: every site that imports `VizelMarkdownFlavor` as a string union (slash-items, demos, extensions).

- [ ] **Step 1:** Add the new types in `markdown/types.ts`:

```ts
import type MarkdownIt from "markdown-it";
import type { JSONContent } from "@tiptap/core";

export type VizelNodeSerializer = (node: JSONContent) => string;
export type VizelMarkSerializer = (text: string) => string;

export interface VizelMarkdownFlavor {
  readonly name: string;
  readonly markdownItPlugins?: readonly ((md: MarkdownIt) => void)[];
  readonly nodeSerializers?: Readonly<Record<string, VizelNodeSerializer>>;
  readonly markSerializers?: Readonly<Record<string, VizelMarkSerializer>>;
  readonly config?: Readonly<Record<string, unknown>>;
}
```

- [ ] **Step 2:** Ship `vizelCommonMarkFlavor` and `vizelGfmFlavor` instances. GFM enables `markdown-it-task-lists`, `markdown-it-footnote` (table support is part of the markdown-it core preset).

- [ ] **Step 3:** Ship `composeVizelMarkdownFlavors(flavors, name?)` in `markdown/flavors/compose.ts`. Apply later flavors after earlier ones; concatenate `markdownItPlugins`; later `nodeSerializers` / `markSerializers` override earlier ones; later `config` shallow-merges over earlier.

- [ ] **Step 4:** Maintain a legacy alias `VIZEL_DEFAULT_FLAVOR = vizelGfmFlavor` so existing call sites keep working without rewrites.

- [ ] **Step 5:** Re-export from `packages/core/src/index.ts`.

## Task 10a-3: Wire flavor into the extension factory

**Files:**
- Modify: `packages/core/src/extensions/markdown.ts`
- Modify: `packages/core/src/utils/editorFactory.ts`

- [ ] **Step 1:** `createVizelMarkdownExtension({ flavor })` accepts a `VizelMarkdownFlavor`. It instantiates a `MarkdownIt` configured by `flavor.markdownItPlugins` and uses it for parse; for serialize it applies `flavor.nodeSerializers` / `markSerializers` on top of `tiptap-markdown`'s defaults.

- [ ] **Step 2:** `createVizelEditorInstance` forwards `options.markdown.flavor` to the extension factory. Default to `vizelGfmFlavor`.

- [ ] **Step 3:** Run lint / typecheck / build / parity / Playwright CT.

- [ ] **Step 4:** Commit and open PR 10a.

```bash
git checkout -b feat/v2-section-10a-markdown-library-swap
git add packages/core/package.json packages/core/src/markdown/ \
        packages/core/src/extensions/markdown.ts \
        packages/core/src/utils/markdown.ts \
        packages/core/src/utils/markdown-flavors.ts \
        packages/core/src/utils/editorFactory.ts \
        packages/core/src/index.ts
git commit -m "feat(core): swap @tiptap/markdown for tiptap-markdown and promote flavor to plugin type"
```

---

## Task 10b: Remaining flavors + module augmentation

**Files:**
- Create: `packages/core/src/markdown/flavors/obsidian.ts`
- Create: `packages/core/src/markdown/flavors/docusaurus.ts`
- Create: `packages/core/src/markdown/flavors/pandoc.ts`
- Create: `packages/core/src/markdown/augment.ts` (module augmentation)
- Modify: `packages/core/src/utils/markdown.ts` (delete capability checks)

- [ ] **Step 1:** Ship `vizelObsidianFlavor` (Obsidian callout, wiki-link), `vizelDocusaurusFlavor` (`:::note` directives), `vizelPandocFlavor` (`markdown-it-deflist`, `markdown-it-footnote`, `markdown-it-sub`, `markdown-it-sup`).

- [ ] **Step 2:** Add `markdown/augment.ts`:

```ts
import type { JSONContent } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Editor {
    getMarkdown(): string;
    markdown: { parse(md: string): JSONContent };
  }
}
```

Import this file from `packages/core/src/index.ts` so the augmentation runs whenever the package is loaded.

- [ ] **Step 3:** Delete the `hasMarkdownExport` / `hasMarkdownStorage` runtime checks in `utils/markdown.ts`; replace with direct calls to `editor.getMarkdown()` / `editor.markdown.parse()`.

- [ ] **Step 4:** Run lint / typecheck / build / parity / Playwright CT.

- [ ] **Step 5:** Open PR 10b.

---

## Task 10c: `markdown` option + lossy-node encoding + MARKDOWN_LOSSY

**Files:**
- Modify: `packages/core/src/types.ts` (add `markdown` option on `VizelEditorOptions`)
- Modify: `packages/core/src/utils/editorFactory.ts` (forward encoding to extension factory)
- Modify: extensions that emit lossy markdown (`embed`, `mention`, `wiki-link`).
- Modify: `packages/core/src/utils/errorHandling.ts` (already exports `MARKDOWN_LOSSY` as a code — verify)

- [ ] **Step 1:** Add `markdown?: { flavor?, encoding? }` to `VizelEditorOptions`.

- [ ] **Step 2:** Each lossy-node extension reads the encoding mode and chooses the right serialization. Default mode is `"link" / "plain" / "obsidian"`; the opt-in `"metadata-comment"` mode emits an HTML comment with the node's metadata.

- [ ] **Step 3:** When a node cannot serialize at all under the chosen flavor (e.g., `mathBlock` in `commonmark` with no fallback), emit `new VizelError("MARKDOWN_LOSSY", ...)` via `emitVizelError(err, options.onError)` with `severity: "warning"`.

- [ ] **Step 4:** Run lint / typecheck / build / parity / Playwright CT.

- [ ] **Step 5:** Open PR 10c.

---

## Task 10d: Round-trip helper + .claude docs

**Files:**
- Create: `packages/core/src/markdown/roundtrip.ts`
- Modify: `.claude/rules/packages/core.md`

- [ ] **Step 1:** Implement `assertMarkdownRoundtrip`:

```ts
import { parseVizelMarkdown, getVizelMarkdown } from "../utils/markdown.ts";
import type { VizelMarkdownFlavor } from "./types.ts";
import { createVizelError } from "../utils/errorHandling.ts";

export function assertMarkdownRoundtrip(
  flavor: VizelMarkdownFlavor,
  samples: readonly { name: string; input: string }[]
): void {
  for (const sample of samples) {
    const parsed = parseVizelMarkdown(sample.input, flavor);
    const serialized = getVizelMarkdown(parsed, flavor);
    if (serialized.trim() !== sample.input.trim()) {
      throw createVizelError(
        "MARKDOWN_LOSSY",
        `Round-trip mismatch in sample "${sample.name}"`,
        { context: { flavor: flavor.name, sample: sample.name } }
      );
    }
  }
}
```

- [ ] **Step 2:** Append a "Markdown Pipeline" section to `.claude/rules/packages/core.md`:
  - Library: `tiptap-markdown` (markdown-it).
  - `VizelMarkdownFlavor` as plugin type: `markdownItPlugins` for parse, `nodeSerializers` / `markSerializers` for serialize, `config` for ambient settings.
  - Parse-tolerant / serialize-strict rule: parser registers plugins from every built-in flavor plus the selected flavor; serializer uses only the selected flavor's hooks.
  - Encoding modes for lossy nodes (table of defaults vs. opt-in lossless modes).
  - `MARKDOWN_LOSSY` emit via `onError` for unrepresentable nodes.
  - Round-trip helper for flavor authors.

- [ ] **Step 3:** Run lint / typecheck / build / parity.

- [ ] **Step 4:** Open PR 10d.

---

## Out of scope (deferred)

- The 100+ sample × 5 flavor round-trip suite belongs under Section 14
  (Playwright CT audit). This plan only ships the helper so flavor
  authors can validate their own work today.
- Demo app rewrites that swap the flavor dropdown over to
  `VizelMarkdownFlavor` instances live in Section 16 (demo overhaul).
