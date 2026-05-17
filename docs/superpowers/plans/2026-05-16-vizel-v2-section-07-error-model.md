# Section 7: Error Model Unification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the partial `VizelError` model with the spec's typed `VizelErrorCode` union (15 categorized codes + `UNKNOWN_ERROR`), add `severity` / `context` fields, introduce an `emitVizelError` helper for runtime errors, and eradicate every `console.warn` / `console.error` call site from `packages/core/src/` (lint-enforced).

**Architecture:** Two sequential sub-PRs.

- **7a** (this plan, tasks 1–5): Type-level extension. Replace the `VizelErrorCode` union with the spec's 15 codes plus `UNKNOWN_ERROR` (kept as the fallback for `wrapAsVizelError`). Add `severity` ("error" | "warning") and `context?: Record<string, unknown>` to the `VizelError` class. Add `emitVizelError` helper. Migrate the two in-tree callers (`editorFactory.ts`, `extensions/image.ts` / `plugins/image-upload.ts` / `extensions/embed.ts`) to the new codes. Backward-compatible at the consumer level apart from renamed codes (breaking change is intentional under v2.0.0).
- **7b** (tasks 6–9): Lint enforcement and call-site eradication. Route every remaining `console.warn` / `console.error` through `emitVizelError`. Enable Biome `noConsole: "error"` with `allow: []` for `packages/core/src/**` (except `emitVizelError` itself, allowed via an inline `// biome-ignore` comment). Update `.claude/rules/architecture.md` and `.claude/rules/code-style.md`.

**Tech Stack:** TypeScript 5.x, Biome (lint), `@tiptap/core` (consumer).

---

## File Map

### 7a — type extension

| File | Action |
|------|--------|
| `packages/core/src/utils/errorHandling.ts` | Modify: rewrite `VizelErrorCode` union, extend `VizelError` constructor signature, add `emitVizelError`. Keep `createVizelError` / `isVizelError` / `wrapAsVizelError` (back-compat). |
| `packages/core/src/utils/editorFactory.ts` | Modify: existing `createVizelError("INVALID_CONFIG", ...)` call already uses a spec code — no change. |
| `packages/core/src/plugins/image-upload.ts` | Modify: replace `console.warn("Image node type not found in schema")` with `emitVizelError(new VizelError("INVALID_EXTENSION", ...), onError)`. Thread `onError` from `VizelImageUploadOptions` if not already plumbed. |
| `packages/core/src/extensions/image.ts` | Modify: caller-side updates to surface `onError` if needed. |
| `packages/core/src/utils/index.ts` | Modify: export `emitVizelError`, export `VizelErrorSeverity` type. |
| `packages/core/src/index.ts` | Modify: re-export `emitVizelError` and `VizelErrorSeverity` alphabetically. |

### 7b — eradication + lint + docs

| File | Action |
|------|--------|
| `packages/core/src/utils/markdown.ts` | Modify: replace 3 × `console.warn(...)` with `emitVizelError` calls. Add `onError?: (err: VizelError) => void` param to `getVizelMarkdown` / `setVizelMarkdown` / `parseVizelMarkdown` (optional, default undefined → `console.error` via emitVizelError default). |
| `packages/core/src/extensions/embed.ts` | Modify: replace 2 × `console.error("Failed to fetch embed data:", err)` with `emitVizelError(new VizelError("EMBED_LOAD_FAILED", ..., { cause: err }), this.options.onFetchError as any ?? undefined)`. The `onFetchError` callback already exists and remains the primary handler; `emitVizelError` only runs in its fallback path. |
| `biome.json` | Modify: add an override for `packages/core/src/**/*.ts` setting `noConsole` to `"error"` with `allow: []`. The `emitVizelError` body gets an inline `// biome-ignore lint/suspicious/noConsole: emit fallback` comment. |
| `.claude/rules/architecture.md` | Modify: rewrite the "Loud errors at boundaries" bullet to reference the three-category model and `emitVizelError`. |
| `.claude/rules/code-style.md` | Modify: add an "Error Handling" section covering the three categories and the `console` ban. |

---

## Task 1 — Replace `VizelErrorCode` union and extend `VizelError`

**Files:**
- Modify: `packages/core/src/utils/errorHandling.ts`

- [ ] **Step 1: Replace the `VizelErrorCode` union**

  Replace lines 14–21 with:

  ```ts
  /**
   * Error codes for Vizel operations.
   *
   * Codes group into four categories:
   *
   * - **Configuration** — developer mistakes; surface by `throw`.
   * - **Input** — runtime data issues; surface via `options.onError`.
   * - **Runtime** — transient failures; surface via `options.onError`.
   * - **Collaboration** — collab-specific transport / sync failures.
   *
   * `UNKNOWN_ERROR` is the fallback used by {@link wrapAsVizelError} when
   * no specific code is supplied.
   */
  export type VizelErrorCode =
    // Configuration errors (developer mistakes — thrown at boundary).
    | "INVALID_CONFIG"
    | "INVALID_EXTENSION"
    | "MISSING_CONTEXT"
    | "INVALID_LOCALE"
    | "SSR_NOT_SUPPORTED"
    | "MISSING_OPTIONAL_DEP"
    // Input errors (runtime data issues — emitted via onError).
    | "INVALID_MARKDOWN"
    | "INVALID_JSON_CONTENT"
    | "INVALID_URL"
    | "MARKDOWN_LOSSY"
    // Runtime errors (transient failures — emitted via onError).
    | "UPLOAD_FAILED"
    | "EMBED_LOAD_FAILED"
    | "CLIPBOARD_FAILED"
    // Collaboration errors.
    | "COLLAB_DISCONNECTED"
    | "COLLAB_SYNC_FAILED"
    // Fallback for `wrapAsVizelError` when no code is supplied.
    | "UNKNOWN_ERROR";

  /**
   * Severity of a {@link VizelError}.
   *
   * - `"error"` — the default. Renders via `console.error` when no
   *   `onError` is set.
   * - `"warning"` — for non-fatal advisories (e.g. `MARKDOWN_LOSSY`).
   *   Stays silent if no `onError` is set.
   */
  export type VizelErrorSeverity = "error" | "warning";
  ```

- [ ] **Step 2: Extend the `VizelError` class**

  Replace the class body (lines 41–63) with:

  ```ts
  /**
   * Options accepted by the {@link VizelError} constructor.
   */
  export interface VizelErrorOptions {
    /** Severity (default: `"error"`). */
    severity?: VizelErrorSeverity;
    /** Free-form structured context attached to the error. */
    context?: Record<string, unknown>;
    /** Underlying cause, forwarded to `Error`'s `cause`. */
    cause?: unknown;
  }

  /**
   * Structured error class for Vizel operations.
   *
   * Extends `Error` so callers get stack traces and `instanceof` checks.
   * The `originalError` field is retained as an alias for `cause` to keep
   * pre-v2.0.0 consumer code compiling.
   */
  export class VizelError extends Error {
    readonly code: VizelErrorCode;
    readonly severity: VizelErrorSeverity;
    readonly context?: Record<string, unknown>;
    /**
     * Alias for `Error.cause`. Retained for source compatibility with
     * pre-v2.0.0 consumers that read `err.originalError`.
     */
    readonly originalError?: unknown;

    constructor(code: VizelErrorCode, message: string, options?: VizelErrorOptions) {
      super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
      this.name = "VizelError";
      this.code = code;
      this.severity = options?.severity ?? "error";
      this.context = options?.context;
      this.originalError = options?.cause;

      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, VizelError);
      }
    }
  }
  ```

- [ ] **Step 3: Update `createVizelError` signature**

  Replace the function (lines 82–88) with:

  ```ts
  /**
   * Create a {@link VizelError} instance. Convenience wrapper around `new VizelError(...)`.
   *
   * @param code - The error code.
   * @param message - Human-readable error message.
   * @param options - Optional severity / context / cause.
   */
  export function createVizelError(
    code: VizelErrorCode,
    message: string,
    options?: VizelErrorOptions
  ): VizelError {
    return new VizelError(code, message, options);
  }
  ```

  Then update `wrapAsVizelError` (lines 170–195) so it forwards `cause` via the new options shape:

  ```ts
  // inside wrapAsVizelError, replace the two `createVizelError(...)` calls:
  if (error instanceof Error) {
    return createVizelError(code, `${prefix}${error.message}`, { cause: error });
  }
  return createVizelError(code, `${prefix}${errorMessage}`, { cause: error });
  ```

- [ ] **Step 4: Add `emitVizelError` helper**

  Append after `wrapAsVizelError`:

  ```ts
  /**
   * Emit a {@link VizelError} through the consumer-supplied `onError`
   * callback, falling back to `console.error` when no callback is set
   * and the severity is `"error"`. Warnings without a callback stay
   * silent.
   *
   * This is the only function inside `packages/core/src/` that calls
   * `console`; Biome's `noConsole` rule enforces this.
   *
   * @param err - The error to emit.
   * @param onError - Optional consumer callback.
   */
  export function emitVizelError(
    err: VizelError,
    onError: ((err: VizelError) => void) | undefined
  ): void {
    if (onError) {
      onError(err);
      return;
    }
    if (err.severity === "error") {
      // biome-ignore lint/suspicious/noConsole: emitVizelError is the
      // single sanctioned console site inside packages/core/src/.
      console.error(err);
    }
  }
  ```

- [ ] **Step 5: Run typecheck and lint**

  Run: `pnpm typecheck && pnpm lint`
  Expected: passes. Pre-existing `noConsole` warnings inside `packages/core/src/` are still allowed at this point (root rule level is `"warn"` with `allow: ["error", "warn"]`); Task 8 will tighten this.

- [ ] **Step 6: Commit**

  ```bash
  git add packages/core/src/utils/errorHandling.ts
  git commit -m "feat(core): extend VizelError model with severity, context, and emit helper"
  ```

---

## Task 2 — Surface `emitVizelError` and `VizelErrorSeverity` from public API

**Files:**
- Modify: `packages/core/src/utils/index.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Add exports in `utils/index.ts`**

  Inside the `errorHandling.ts` export block (around line 48), add `emitVizelError` to the value exports (alphabetical placement) and `VizelErrorSeverity` to the type exports (alphabetical placement). The final block should read:

  ```ts
  export {
    createVizelError,
    emitVizelError,
    isVizelError,
    VizelError,
    type VizelErrorCode,
    type VizelErrorOptions,
    type VizelErrorSeverity,
    wrapAsVizelError,
    type WrapAsVizelErrorOptions,
  } from "./errorHandling.ts";
  ```

- [ ] **Step 2: Mirror in root `packages/core/src/index.ts`**

  Find the existing `errorHandling` re-export block (around lines 430–510) and update it to include the new symbols alphabetically. Verify by running:

  ```bash
  grep -A 12 "errorHandling" packages/core/src/index.ts
  ```

  Expect to see `emitVizelError` and `VizelErrorSeverity` (and `VizelErrorOptions`) in the block.

- [ ] **Step 3: Run typecheck**

  Run: `pnpm typecheck`
  Expected: passes.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/core/src/utils/index.ts packages/core/src/index.ts
  git commit -m "feat(core): expose emitVizelError and VizelErrorSeverity from public API"
  ```

---

## Task 3 — Migrate `plugins/image-upload.ts` `console.warn` to `emitVizelError`

**Files:**
- Modify: `packages/core/src/plugins/image-upload.ts`

**Background:** Line 260 calls `console.warn("Image node type not found in schema")`. The plugin already accepts an `onUploadError` callback. Reuse it as the error sink, because a missing image node in the schema is a configuration mistake that the consumer must learn about.

- [ ] **Step 1: Replace the `console.warn` call**

  Replace:

  ```ts
  if (!imageNode) {
    console.warn("Image node type not found in schema");
    return;
  }
  ```

  With:

  ```ts
  if (!imageNode) {
    emitVizelError(
      new VizelError(
        "INVALID_EXTENSION",
        "Image node type not found in schema. Ensure the Image extension is registered.",
        { severity: "error" }
      ),
      // `onUploadError` accepts `(error: Error, file: File)`; bridge to
      // a VizelError sink by ignoring the file param.
      onUploadError ? (err) => onUploadError(err, file) : undefined
    );
    return;
  }
  ```

  Add an import at the top of the file:

  ```ts
  import { emitVizelError, VizelError } from "../utils/errorHandling.ts";
  ```

- [ ] **Step 2: Run typecheck**

  Run: `pnpm typecheck`
  Expected: passes.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/core/src/plugins/image-upload.ts
  git commit -m "refactor(core): replace image-upload console.warn with emitVizelError"
  ```

---

## Task 4 — Run lint to confirm nothing else broke

- [ ] **Step 1:** `pnpm lint`. Expect pass (pre-existing `console.warn` calls in `utils/markdown.ts` and `extensions/embed.ts` remain — they are deferred to 7b).

- [ ] **Step 2:** `pnpm typecheck`. Expect pass.

---

## Task 5 — Open and merge PR 7a

- [ ] **Step 1:** Branch from `main`, push, open PR titled `feat(core): extend VizelError model with typed codes and emit helper`.

- [ ] **Step 2:** Body uses the format in `.claude/rules/git.md`. Test Plan should include `pnpm typecheck`, `pnpm lint`.

- [ ] **Step 3:** Wait for CI; merge when green.

---

## Task 6 — 7b: Replace `console.warn` calls in `utils/markdown.ts`

**Files:**
- Modify: `packages/core/src/utils/markdown.ts`

**Background:** `getVizelMarkdown`, `setVizelMarkdown`, and `parseVizelMarkdown` each call `console.warn("[Vizel] Markdown extension is not enabled. Enable it via features.markdown option.")` when the markdown extension is missing. This is a **configuration mistake** (the consumer asked for a markdown operation without enabling the feature) — surface it as an `INVALID_EXTENSION` error.

These helpers currently accept no error-callback option. Add an optional `onError` parameter to each.

- [ ] **Step 1: Add `onError` parameter to the three helpers**

  For each of `getVizelMarkdown`, `setVizelMarkdown`, `parseVizelMarkdown`, add a final `onError?: (err: VizelError) => void` parameter (in the options bag where one exists, or as a third positional argument for `getVizelMarkdown`). Example for `getVizelMarkdown`:

  ```ts
  export function getVizelMarkdown(
    editor: Editor | null | undefined,
    onError?: (err: VizelError) => void
  ): string {
    if (!editor) return "";
    if (!hasMarkdownExport(editor)) {
      emitVizelError(
        new VizelError(
          "INVALID_EXTENSION",
          "Markdown extension is not enabled. Enable it via the `features.markdown` option."
        ),
        onError
      );
      return "";
    }
    return editor.getMarkdown();
  }
  ```

  For `setVizelMarkdown` and `parseVizelMarkdown`, fold `onError` into the existing options bag:

  ```ts
  export function setVizelMarkdown(
    editor: Editor | null | undefined,
    markdown: string,
    options: { transformDiagrams?: boolean; onError?: (err: VizelError) => void } = {}
  ): boolean { ... }
  ```

- [ ] **Step 2: Add imports**

  ```ts
  import { emitVizelError, VizelError } from "./errorHandling.ts";
  ```

- [ ] **Step 3:** `pnpm typecheck`. Expect pass.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/core/src/utils/markdown.ts
  git commit -m "refactor(core): route markdown helper warnings through emitVizelError"
  ```

---

## Task 7 — Replace `console.error` calls in `extensions/embed.ts`

**Files:**
- Modify: `packages/core/src/extensions/embed.ts`

**Background:** Two call sites (lines 702 and 909) call `console.error("Failed to fetch embed data:", err)` in the fallback branch when no `onFetchError` is configured. Replace with `emitVizelError`.

- [ ] **Step 1: At both call sites, replace**

  ```ts
  try {
    if (this.options.onFetchError) {
      this.options.onFetchError(err, url);
    } else {
      console.error("Failed to fetch embed data:", err);
    }
  } catch { ... }
  ```

  With:

  ```ts
  try {
    emitVizelError(
      new VizelError(
        "EMBED_LOAD_FAILED",
        `Failed to fetch embed data for ${url}`,
        { cause: err, context: { url } }
      ),
      this.options.onFetchError ? () => this.options.onFetchError?.(err, url) : undefined
    );
  } catch { ... }
  ```

- [ ] **Step 2: Add imports**

  ```ts
  import { emitVizelError, VizelError } from "../utils/errorHandling.ts";
  ```

- [ ] **Step 3:** `pnpm typecheck`. Expect pass.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/core/src/extensions/embed.ts
  git commit -m "refactor(core): route embed fetch failures through emitVizelError"
  ```

---

## Task 8 — Enable Biome `noConsole: "error"` for `packages/core/src/`

**Files:**
- Modify: `biome.json`

- [ ] **Step 1: Add an override block**

  Insert into the `overrides` array (alphabetical with other `packages/...` blocks):

  ```json
  {
    "includes": ["packages/core/src/**/*.ts"],
    "linter": {
      "rules": {
        "suspicious": {
          "noConsole": {
            "level": "error",
            "options": { "allow": [] }
          }
        }
      }
    }
  }
  ```

  Verify that the existing `emitVizelError` body in `packages/core/src/utils/errorHandling.ts` has the `// biome-ignore lint/suspicious/noConsole: ...` comment from Task 1.

- [ ] **Step 2:** `pnpm lint`. Expect pass (every `console.warn` / `console.error` in `packages/core/src/**/*.ts` is now either eradicated or annotated). If a call site emerges that we missed, fix it now and re-run.

- [ ] **Step 3:** `pnpm typecheck`. Expect pass.

- [ ] **Step 4: Commit**

  ```bash
  git add biome.json
  git commit -m "build(core): enforce noConsole for packages/core/src/"
  ```

---

## Task 9 — Update `.claude/` rules

**Files:**
- Modify: `.claude/rules/architecture.md`
- Modify: `.claude/rules/code-style.md`

- [ ] **Step 1: Rewrite the architecture "Loud errors at boundaries" bullet**

  Open `.claude/rules/architecture.md`, find the "Consumer-facing invariants" section, and replace the existing "Loud errors at boundaries" bullet with:

  ```markdown
  - **Loud errors at boundaries.** Misuse — conflicting props, invalid
    editor configuration, missing context — surfaces as a typed
    `VizelError` carrying a stable `code` from `VizelErrorCode`.
    Configuration mistakes throw; runtime / input errors flow through
    `emitVizelError` and the consumer-supplied `onError` callback.
    `console.warn` and `console.error` are banned inside
    `packages/core/src/`; the only allowed `console.error` lives inside
    `emitVizelError`.
  ```

- [ ] **Step 2: Add Error Handling section to code-style.md**

  Open `.claude/rules/code-style.md` and append a new section before the final `</file>`:

  ```markdown
  ## Error Handling

  Vizel uses a single error model rooted at `VizelError`. Errors fall
  into three categories, each with its own delivery channel:

  | Category | Delivery | Examples |
  |----------|----------|----------|
  | Developer mistake (boundary) | `throw new VizelError(...)` | `INVALID_CONFIG`, `MISSING_CONTEXT` |
  | Runtime error (recoverable) | `emitVizelError(err, options.onError)` | `UPLOAD_FAILED`, `EMBED_LOAD_FAILED` |
  | Warning (advisory) | `emitVizelError(err, options.onError)` with `severity: "warning"` | `MARKDOWN_LOSSY` |

  Rules:

  - **No `console` calls** inside `packages/core/src/`. Biome's
    `noConsole` rule enforces this. The single sanctioned site is
    `emitVizelError` itself, which falls back to `console.error` when no
    callback is supplied.
  - Always pass a stable `VizelErrorCode` — do not invent ad-hoc strings.
  - Attach structured context via the `context` field (`{ url, file, ... }`)
    rather than embedding details in the message.
  - Forward the underlying cause via the `cause` option so stack traces
    survive.
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add .claude/rules/architecture.md .claude/rules/code-style.md
  git commit -m "docs: document VizelError model in architecture and code-style rules"
  ```

---

## Task 10 — Open and merge PR 7b

- [ ] **Step 1:** Push branch and open PR titled `refactor(core): eradicate console calls and enforce noConsole`.

- [ ] **Step 2:** Body must enumerate every replaced call site (`utils/markdown.ts:57,88,126`; `extensions/embed.ts:702,909`; `plugins/image-upload.ts:260` already done in 7a).

- [ ] **Step 3:** Wait for CI; merge when green.

---

## Acceptance Criteria

- `grep -rn "console\." packages/core/src/` returns at most one hit: the annotated `console.error(err)` inside `emitVizelError`.
- `pnpm lint` passes with `noConsole: "error"` active for `packages/core/src/**/*.ts`.
- `pnpm typecheck` passes.
- All 15 spec codes plus `UNKNOWN_ERROR` are present in the `VizelErrorCode` union.
- `VizelError` carries `code`, `severity`, `context`, and `originalError` (alias for `cause`).
- `emitVizelError` is exported from `@vizel/core` and `@vizel/{react,vue,svelte}` (via the existing re-export mirror).
- `.claude/rules/architecture.md` and `.claude/rules/code-style.md` reflect the new model.
