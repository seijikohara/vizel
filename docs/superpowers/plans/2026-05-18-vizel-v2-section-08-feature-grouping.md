# Section 8 — Feature Option Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `VizelFeatureOptions` from a flat shape into a nested
`{ content, interaction, collaboration }` shape, lift `codeBlock` and `link`
out of `features` into the always-on core, rename `slashCommand` → `slashMenu`
and `comment` → `comments`, and add runtime entries (plus implementations
where required) for every new feature listed in spec Section 8.

**Architecture:** All changes flow through `@vizel/core`. Framework packages
are pure consumers because they receive `VizelFeatureOptions` only through
the typed re-export. Demo apps and Playwright fixtures are updated in
lockstep. The spec is the source of truth for the final shape; existing
features are mapped into one of the three categories by user motivation.

**Tech Stack:** TypeScript, Tiptap v2 extensions
(`@tiptap/extension-underline`, `@tiptap/extension-highlight`,
`@tiptap/extension-typography`), Vite, Biome, lefthook,
Playwright Component Tests.

---

## Spec mapping (binding)

The implementation must end with the shape below in `packages/core/src/types.ts`.

```ts
export interface VizelFeatureOptions {
  readonly content?: {
    readonly image?: boolean | VizelImageFeatureOptions;
    readonly table?: boolean | VizelTableOptions;
    readonly mathematics?: boolean | VizelMathematicsOptions;
    readonly diagram?: boolean | VizelDiagramOptions;
    readonly embed?: boolean | VizelEmbedOptions;
    readonly callout?: boolean | VizelCalloutOptions;
    readonly details?: boolean | VizelDetailsOptions;
    readonly textColor?: boolean | VizelTextColorOptions;
    readonly highlight?: boolean | VizelHighlightOptions;
    readonly underline?: boolean;
    readonly superscript?: boolean;
    readonly subscript?: boolean;
    readonly taskList?: boolean | VizelTaskListExtensionsOptions;
    readonly wikiLink?: boolean | VizelWikiLinkOptions;
    readonly tableOfContents?: boolean | VizelTableOfContentsOptions;
  };
  readonly interaction?: {
    readonly slashMenu?: boolean | VizelSlashCommandOptions;
    readonly blockMenu?: boolean | VizelBlockMenuOptions;
    readonly bubbleMenu?: boolean | VizelBubbleMenuOptions;
    readonly dragHandle?: boolean | VizelDragHandleOptions;
    readonly mention?: boolean | VizelMentionOptions;
    readonly findAndReplace?: boolean | VizelFindReplaceOptions;
    readonly autoSave?: boolean | VizelAutoSaveOptions;
    readonly placeholder?: string;
    readonly characterCount?: boolean | VizelCharacterCountOptions;
    readonly historyDepth?: number;
    readonly typography?: boolean | VizelTypographyOptions;
    readonly visualHierarchy?: boolean | VizelVisualHierarchyOptions;
  };
  readonly collaboration?: {
    readonly provider?: VizelCollaborationProvider;
    readonly comments?: boolean | VizelCommentMarkOptions;
    readonly versionHistory?: boolean | VizelVersionHistoryOptions;
    readonly presence?: VizelPresenceOptions;
  };
}
```

Always-on core (no opt-in flag — always loaded):
`Document`, `Paragraph`, `Text`, `Heading`, `Bold`, `Italic`, `Strike`,
`Code`, `BulletList`, `OrderedList`, `ListItem`, `Blockquote`,
`HardBreak`, `HorizontalRule`, `Dropcursor`, `Gapcursor`, `ListKeymap`,
`History` (when `collaboration.provider` is unset), `Placeholder`,
**`CodeBlock` (with lowlight)**, **`Link`**, **`Markdown` (from
`createVizelMarkdownExtension`)**. `Underline`, `Superscript`, and
`Subscript` move OUT of always-on core into `content.*`.

Existing feature → new path mapping (used throughout):

| Existing `features.X` | New `features.<cat>.X` |
|-----------------------|------------------------|
| `slashCommand` | `interaction.slashMenu` |
| `table` | `content.table` |
| `link` | (removed — always-on core) |
| `image` | `content.image` |
| `markdown` | (removed — always-on core) |
| `taskList` | `content.taskList` |
| `characterCount` | `interaction.characterCount` |
| `textColor` | `content.textColor` |
| `codeBlock` | (removed — always-on core) |
| `mathematics` | `content.mathematics` |
| `dragHandle` | `interaction.dragHandle` |
| `embed` | `content.embed` |
| `details` | `content.details` |
| `callout` | `content.callout` |
| `diagram` | `content.diagram` |
| `wikiLink` | `content.wikiLink` |
| `mention` | `interaction.mention` |
| `tableOfContents` | `content.tableOfContents` |
| `comment` | `collaboration.comments` |
| `superscript` | `content.superscript` |
| `subscript` | `content.subscript` |
| `typography` | `interaction.typography` |
| `collaboration: true` | `collaboration.provider` (presence implies excludeHistory) |

New entries with full new implementation in Section 8:

| Path | New implementation |
|------|--------------------|
| `content.highlight` | Split `@tiptap/extension-highlight` out of the textColor extension bundle. New `VizelHighlightOptions` type. |
| `content.underline` | New entry; underline moves from always-on into `content.underline`. `VizelUnderlineOptions` is not introduced (boolean only — spec Section 8 type signature does not require options). |
| `interaction.blockMenu` | Wire current `VizelBlockMenu` rendering to a feature flag. New `VizelBlockMenuOptions` type. |
| `interaction.bubbleMenu` | Wire current `VizelBubbleMenu` rendering to a feature flag. New `VizelBubbleMenuOptions` type. |
| `interaction.findAndReplace` | Wire current `VizelFindReplace` rendering to a feature flag. New `VizelFindReplaceOptions` type. |
| `interaction.autoSave` | Move `useVizelAutoSave` opt-in into features. New `VizelAutoSaveOptions` type re-exports the existing hook options shape. |
| `interaction.placeholder` | Move `placeholder` from `VizelEditorOptions` top level into `features.interaction.placeholder`. |
| `interaction.historyDepth` | Expose Tiptap History `depth` configuration. |
| `interaction.typography` | Convert from `boolean` to `boolean | VizelTypographyOptions` (re-export Tiptap typography rule subset). |
| `interaction.visualHierarchy` | New `createVizelVisualHierarchyExtension` with `data-vizel-depth` decoration. New SCSS partial `styles/_block-hierarchy.scss`. |
| `collaboration.provider` | New `VizelCollaborationProvider` type. Replaces `features.collaboration: true`. |
| `collaboration.versionHistory` | Move `useVizelVersionHistory` opt-in into features. New `VizelVersionHistoryOptions` type. |
| `collaboration.presence` | New `createVizelPresenceExtension` with `Decoration.widget` cursors and `Decoration.inline` selections. New `VizelPresenceOptions`, `VizelPresenceAwareness`, `VizelPresenceUser`, `VizelPresenceUserState` types. |

---

## Sub-PR breakdown

Section 8 ships as six sub-PRs. Each lands independently with green CI.

| Sub-PR | Title | Scope |
|--------|-------|-------|
| 8a | Type hierarchy + existing-feature migration | Nest `VizelFeatureOptions` into `{content, interaction, collaboration}`. Rename `slashCommand`→`slashMenu`, `comment`→`comments`. Move `codeBlock`/`link`/`markdown` to always-on core. Move `underline`/`superscript`/`subscript` out of always-on into `content.*`. Update `base.ts`, `editorHelpers.ts`, demo apps, CT fixtures. |
| 8b | New content marks (highlight independent) | Split `Highlight` out of textColor bundle. Add `VizelHighlightOptions` type. New `addHighlightExtension`. |
| 8c | New interaction features (wire existing) | Add `placeholder`/`autoSave`/`typography options`/`historyDepth`/`blockMenu options`/`bubbleMenu options`/`findAndReplace options`. Wire `useVizelAutoSave` consumption to `features.interaction.autoSave` configuration. |
| 8d | visualHierarchy extension | New `createVizelVisualHierarchyExtension` (decorations), `styles/_block-hierarchy.scss`, content type integration. |
| 8e | Collaboration grouping (provider, versionHistory, presence) | Add `VizelCollaborationProvider`. Wire `useVizelVersionHistory` to features. New `createVizelPresenceExtension` with awareness adapter. |
| 8f | Helpers, validation, docs | `vizelDefaultFeatures()` helper. Runtime validation (`features.collaboration.comments requires features.collaboration.provider`). Update `.claude/rules/packages/core.md` Feature Categories section. |

This plan file currently contains the **full detail of 8a**. Sub-PR plans
8b–8f are written as separate top-level sections of this same file as
each sub-PR begins, so that the overview/spec mapping above stays the
single source of truth.

---

## Sub-PR 8a — Type hierarchy + existing-feature migration

**Branch:** `feat/v2-section-08a-features-hierarchy`

**Goal:** Land the new `VizelFeatureOptions` shape and migrate every
existing call site (core, framework packages, demos, CT fixtures) so the
codebase compiles, lints, and passes CT with the new paths. No new
runtime features land in 8a; that is the job of 8b–8f.

### File map for 8a

**Modify:**
- `packages/core/src/types.ts` — replace `VizelFeatureOptions` with the
  nested shape. `interaction.placeholder` is added but the top-level
  `VizelEditorOptions.placeholder` is NOT removed in 8a (8c removes
  it after `interaction.placeholder` is fully wired in `base.ts`).
- `packages/core/src/extensions/base.ts` — update every `features.X`
  read to `features.<cat>?.X`. Move `Underline`, `Superscript`,
  `Subscript` from always-on into `content.*` gates. Make `link`,
  `markdown`, and `codeBlock` unconditional (always-on). Rename
  helpers (`addSlashCommandExtension` → `addSlashMenuExtension`,
  `addCommentExtension` → `addCommentsExtension`).
- `packages/core/src/utils/editorHelpers.ts` — update
  `resolveVizelFeatures` to operate on the nested shape, working only
  with `features.interaction.slashMenu` (renamed from `slashCommand`).
- `packages/core/src/utils/editorFactory.ts` — confirm pass-through is
  unaffected (it forwards `features` verbatim, no field-level access).
- `packages/core/src/index.ts` — no symbol changes; type re-export
  carries the new shape automatically.
- `packages/{react,vue,svelte}/src/components/Vizel.*` — no API change;
  these components forward `features` verbatim. Only update internal
  comments / type uses if they reference the old path.
- `apps/demo/react/src/App.tsx` — rewrite the `features={{…}}` object
  to the nested shape; remove `markdown`/`codeBlock` (now always-on).
- `apps/demo/vue/src/App.vue` — same migration.
- `apps/demo/svelte/src/App.svelte` — same migration.
- `tests/ct/**/*Fixture.*` — update any fixture that passes
  `features` to the new paths.
- `.claude/rules/packages/core.md` — note in the extension catalog that
  Markdown / CodeBlock / Link are always-on; existing rows stay.
- `.claude/rules/cross-framework.md` — props parity table mentions
  `features: VizelFeatureOptions` (no row-shape change needed; the
  type re-shape is invisible at the table level).

**Create:** None in 8a.

**Delete:** None in 8a.

### Tasks for 8a

### Task 1: Rename the type shape in `types.ts`

**Files:**
- Modify: `packages/core/src/types.ts:58-122` (replace
  `VizelFeatureOptions` interface body).

- [ ] **Step 1: Replace `VizelFeatureOptions` with the nested shape**

In `packages/core/src/types.ts`, replace the existing interface
(lines 44–122) with:

```ts
/**
 * Feature configuration for Vizel editor.
 *
 * Features are grouped into three categories that answer different
 * consumer questions:
 *
 * - `content` — What can the document contain?
 * - `interaction` — How does the user edit?
 * - `collaboration` — Who edits together?
 *
 * Each field accepts one of:
 *
 * - `true` — enable the feature with default options.
 * - `false` — disable the feature.
 * - an options object — enable with custom options.
 *
 * Always-on core (no opt-in needed): paragraph, heading, list,
 * blockquote, bold/italic/strike/code marks, hard break, horizontal
 * rule, link, code block (with lowlight), markdown import/export,
 * undo/redo. These extensions load regardless of `features`.
 */
export interface VizelFeatureOptions {
  readonly content?: VizelContentFeatureOptions;
  readonly interaction?: VizelInteractionFeatureOptions;
  readonly collaboration?: VizelCollaborationFeatureOptions;
}

export interface VizelContentFeatureOptions {
  readonly image?: VizelImageFeatureOptions | boolean;
  readonly table?: VizelTableOptions | boolean;
  readonly mathematics?: VizelMathematicsOptions | boolean;
  readonly diagram?: VizelDiagramOptions | boolean;
  readonly embed?: VizelEmbedOptions | boolean;
  readonly callout?: VizelCalloutOptions | boolean;
  readonly details?: VizelDetailsOptions | boolean;
  readonly textColor?: VizelTextColorOptions | boolean;
  readonly underline?: boolean;
  readonly superscript?: boolean;
  readonly subscript?: boolean;
  readonly taskList?: VizelTaskListExtensionsOptions | boolean;
  readonly wikiLink?: VizelWikiLinkOptions | boolean;
  readonly tableOfContents?: VizelTableOfContentsOptions | boolean;
}

export interface VizelInteractionFeatureOptions {
  readonly slashMenu?: VizelSlashCommandOptions | boolean;
  readonly dragHandle?: VizelDragHandleOptions | boolean;
  readonly mention?: VizelMentionOptions | boolean;
  readonly characterCount?: VizelCharacterCountOptions | boolean;
  readonly typography?: boolean;
}

export interface VizelCollaborationFeatureOptions {
  readonly comments?: VizelCommentMarkOptions | boolean;
  /**
   * Enable collaboration mode. When set (any truthy value), the
   * History extension is excluded — Yjs provides its own undo
   * manager. In 8a this is a `boolean`; 8e replaces it with the
   * structured `VizelCollaborationProvider` type.
   */
  readonly provider?: boolean;
}
```

Note that 8a deliberately keeps `interaction.typography` as `boolean`
(not `boolean | VizelTypographyOptions`) and does NOT introduce
`interaction.blockMenu`, `interaction.bubbleMenu`,
`interaction.findAndReplace`, `interaction.autoSave`,
`interaction.placeholder`, `interaction.historyDepth`,
`interaction.visualHierarchy`, `content.highlight`,
`collaboration.versionHistory`, or `collaboration.presence`. Those
fields land in 8b–8e.

- [ ] **Step 2: Run typecheck and observe the cascade of failures**

Run: `pnpm typecheck`
Expected: errors in `packages/core/src/extensions/base.ts` (every
`features.X` access for the renamed paths) and in
`packages/core/src/utils/editorHelpers.ts` (`features.slashCommand`).
This is the signal that Task 2 onward is needed.

- [ ] **Step 3: Do NOT commit yet** — Task 1 alone leaves the repo
broken. Continue to Task 2.

### Task 2: Update `editorHelpers.ts` to use the nested path

**Files:**
- Modify: `packages/core/src/utils/editorHelpers.ts:53-98`.

- [ ] **Step 1: Update `VizelResolveFeaturesOptions` and
`resolveVizelFeatures` to read/write `features.interaction.slashMenu`**

Replace lines 53–98 with:

```ts
/**
 * Options for resolving features with a custom slash menu renderer.
 */
export interface VizelResolveFeaturesOptions {
  /** The features configuration */
  features?: VizelFeatureOptions;
  /** Factory function to create the slash menu renderer */
  createSlashMenuRenderer: () => Partial<SuggestionOptions<VizelSlashCommandItem>>;
}

/**
 * Resolves feature options with a default slash menu renderer.
 * If `interaction.slashMenu` is enabled but no suggestion renderer is
 * provided, attaches the supplied default.
 */
export function resolveVizelFeatures(
  options: VizelResolveFeaturesOptions
): VizelFeatureOptions | undefined {
  const { features, createSlashMenuRenderer } = options;

  if (!features) {
    return {
      interaction: {
        slashMenu: { suggestion: createSlashMenuRenderer() },
      },
    };
  }

  const interaction = features.interaction;
  if (interaction?.slashMenu === false) {
    return features;
  }

  const slashOptions =
    typeof interaction?.slashMenu === "object" ? interaction.slashMenu : {};

  if (slashOptions.suggestion) {
    return features;
  }

  return {
    ...features,
    interaction: {
      ...interaction,
      slashMenu: {
        ...slashOptions,
        suggestion: createSlashMenuRenderer(),
      },
    },
  };
}
```

- [ ] **Step 2: Re-run typecheck for `editorHelpers.ts`**

Run: `pnpm typecheck`
Expected: this file is clean; remaining failures stay in `base.ts`.

### Task 3: Update `extensions/base.ts` — content category

**Files:**
- Modify: `packages/core/src/extensions/base.ts:89-125` (move
  `Underline` out of always-on).
- Modify: `packages/core/src/extensions/base.ts:130-378` (every
  `features.X` access for renamed/moved fields).
- Modify: `packages/core/src/extensions/base.ts:426-492` (the
  orchestration function `createVizelExtensions`).

- [ ] **Step 1: Remove `Underline` from `createBaseExtensions`**

In `packages/core/src/extensions/base.ts:94-117`, drop `Underline` from
the marks block. The replacement:

```ts
  const extensions: Extensions = [
    // Nodes
    Document,
    Paragraph,
    Text,
    Heading.configure({ levels: headingLevels }),
    Blockquote,
    BulletList,
    OrderedList,
    ListItem,
    // CodeBlock is added separately based on feature options
    HardBreak,
    HorizontalRule,
    // Marks
    Bold,
    Code,
    Italic,
    Strike,
    // Functionality
    Dropcursor.configure({ color: "#3b82f6", width: 2 }),
    Gapcursor,
    ListKeymap,
  ];
```

- [ ] **Step 2: Rewrite every `addXExtension` helper to read the new
nested path**

The full mechanical mapping for each helper. Apply each one in order:

```ts
// addSlashMenuExtension (rename from addSlashCommandExtension)
function addSlashMenuExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const slashMenu = features.interaction?.slashMenu;
  if (slashMenu === false) return;

  const slashOptions = typeof slashMenu === "object" ? slashMenu : {};
  const items: VizelSlashCommandItem[] = slashOptions.items ?? vizelDefaultSlashCommands;

  extensions.push(
    VizelSlashCommand.configure({
      items,
      ...(slashOptions.suggestion !== undefined && {
        suggestion: slashOptions.suggestion,
      }),
    })
  );
}

function addImageExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const image = features.content?.image;
  if (image === false) return;

  const imageOptions = typeof image === "object" ? image : {};
  // …rest of function unchanged; just substitute `imageOptions` for the old local.
}

function addTaskListExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const taskList = features.content?.taskList;
  if (taskList === false) return;
  const taskListOptions = typeof taskList === "object" ? taskList : {};
  extensions.push(...createVizelTaskListExtensions(taskListOptions));
}

function addCharacterCountExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const characterCount = features.interaction?.characterCount;
  if (characterCount === false) return;
  const characterCountOptions = typeof characterCount === "object" ? characterCount : {};
  extensions.push(createVizelCharacterCountExtension(characterCountOptions));
}

function addTextColorExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const textColor = features.content?.textColor;
  if (textColor === false) return;
  const textColorOptions = typeof textColor === "object" ? textColor : {};
  extensions.push(...createVizelTextColorExtensions(textColorOptions));
}

function addMathematicsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const mathematics = features.content?.mathematics;
  if (mathematics === false) return;
  const mathOptions = typeof mathematics === "object" ? mathematics : {};
  extensions.push(...createVizelMathematicsExtensions(mathOptions));
}

function addDragHandleExtension(
  extensions: Extensions,
  features: VizelFeatureOptions,
  locale?: VizelLocale,
): void {
  const dragHandle = features.interaction?.dragHandle;
  if (dragHandle === false) return;
  const dragHandleOptions = typeof dragHandle === "object" ? dragHandle : {};
  extensions.push(
    ...createVizelDragHandleExtensions({
      ...dragHandleOptions,
      ...(locale !== undefined && { locale }),
    })
  );
}

function addDetailsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const details = features.content?.details;
  if (details === false) return;
  const detailsOptions = typeof details === "object" ? details : {};
  extensions.push(...createVizelDetailsExtensions(detailsOptions));
}

function addEmbedExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const embed = features.content?.embed;
  if (embed === false) return;
  const embedOptions = typeof embed === "object" ? embed : {};
  extensions.push(createVizelEmbedExtension(embedOptions));
}

function addDiagramExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const diagram = features.content?.diagram;
  if (diagram === false) return;
  const diagramOptions = typeof diagram === "object" ? diagram : {};
  extensions.push(createVizelDiagramExtension(diagramOptions));
}

function addTableOfContentsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const tableOfContents = features.content?.tableOfContents;
  if (tableOfContents === false) return;
  const tocOptions = typeof tableOfContents === "object" ? tableOfContents : {};
  extensions.push(createVizelTableOfContentsExtension(tocOptions));
}

function addWikiLinkExtension(
  extensions: Extensions,
  features: VizelFeatureOptions,
  flavorConfig: VizelFlavorConfig,
): void {
  const wikiLink = features.content?.wikiLink;
  if (!wikiLink) return;
  const wikiLinkOptions = typeof wikiLink === "object" ? wikiLink : {};
  extensions.push(
    createVizelWikiLinkExtension({
      ...wikiLinkOptions,
      serializeAsWikiLink: wikiLinkOptions.serializeAsWikiLink ?? flavorConfig.wikiLinkSerialize,
    })
  );
}

function addCalloutExtension(
  extensions: Extensions,
  features: VizelFeatureOptions,
  flavorConfig: VizelFlavorConfig,
): void {
  const callout = features.content?.callout;
  if (callout === false) return;
  const calloutOptions = typeof callout === "object" ? callout : {};
  extensions.push(
    createVizelCalloutExtension({
      ...calloutOptions,
      markdownFormat: calloutOptions.markdownFormat ?? flavorConfig.calloutFormat,
    })
  );
}

function addMentionExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const mention = features.interaction?.mention;
  if (!mention) return;
  const mentionOptions = typeof mention === "object" ? mention : {};
  extensions.push(createVizelMentionExtension(mentionOptions));
}

function addCommentsExtension(extensions: Extensions, features: VizelFeatureOptions): void {
  const comments = features.collaboration?.comments;
  if (!comments) return;
  const commentOptions = typeof comments === "object" ? comments : {};
  extensions.push(createVizelCommentExtension(commentOptions));
}
```

- [ ] **Step 3: Delete `addMarkdownExtension` from `base.ts` and load
Markdown unconditionally**

Remove the helper entirely (it currently lives at lines 175–182) and
delete its call site inside `createVizelExtensions`. In its place, push
`createVizelMarkdownExtension({})` unconditionally near the start
of `createVizelExtensions`. Markdown options (flavor, encoding) are
already threaded through the top-level `markdown` option on
`VizelEditorOptions` (Section 10) — 8a does not touch that surface.

- [ ] **Step 4: Make `Link` always-on**

Remove the `features.link` branch at lines 457–460 and unconditionally
push `createVizelLinkExtension({})` early in `createVizelExtensions`.
(The configurable `VizelLinkOptions` surface stays available through
Section 10's top-level options; consumers who currently customize the
link via `features.link: {...}` get a typed compile error and migrate.)

- [ ] **Step 5: Make `CodeBlock` always-on**

Replace the entire `addCodeBlockExtension` function body with the
unconditional path:

```ts
async function addCodeBlockExtension(
  extensions: Extensions,
  locale?: VizelLocale,
): Promise<void> {
  const { createVizelCodeBlockExtension } = await import("./code-block-lowlight.ts");
  extensions.push(
    ...(await createVizelCodeBlockExtension({
      ...(locale !== undefined && { locale }),
    }))
  );
}
```

The `features` parameter is no longer needed. Update the call site
inside `createVizelExtensions` accordingly:

```ts
await addCodeBlockExtension(extensions, locale);
```

- [ ] **Step 6: Move `Underline` / `Superscript` / `Subscript` into
gated helpers**

Replace the typography-marks block (currently lines 478–488) with:

```ts
  if (features.content?.underline !== false) {
    extensions.push(Underline);
  }
  if (features.content?.superscript !== false) {
    extensions.push(Superscript);
  }
  if (features.content?.subscript !== false) {
    extensions.push(Subscript);
  }
  if (features.interaction?.typography !== false) {
    extensions.push(Typography);
  }
```

Note the comparator `!== false` matches the existing semantics: marks
default to ON unless explicitly disabled. 8a keeps that default; 8b's
underline / highlight independence does not change the default.

- [ ] **Step 7: Update the `collaboration` check**

Replace `const excludeHistory = features.collaboration === true;` (line
438) with:

```ts
  const excludeHistory = Boolean(features.collaboration?.provider);
```

- [ ] **Step 8: Update the table branch**

Replace lines 452–455 with:

```ts
  const table = features.content?.table;
  if (table !== false) {
    const tableOptions = typeof table === "object" ? table : {};
    extensions.push(...createVizelTableExtensions(tableOptions));
  }
```

- [ ] **Step 9: Rewire the orchestration calls**

The `createVizelExtensions` function (around line 449 onward) should now
call the renamed helpers in this order:

```ts
  // Always-on (no feature flag)
  extensions.push(createVizelLinkExtension({}));
  extensions.push(createVizelMarkdownExtension({}));

  // Opt-out content
  // (table handled inline above)

  // Opt-out / opt-in features
  addSlashMenuExtension(extensions, features);
  addImageExtension(extensions, features);
  addTaskListExtension(extensions, features);
  addCharacterCountExtension(extensions, features);
  addTextColorExtension(extensions, features);
  addMathematicsExtension(extensions, features);
  addDragHandleExtension(extensions, features, locale);
  addDetailsExtension(extensions, features);
  addCalloutExtension(extensions, features, flavorConfig);
  addEmbedExtension(extensions, features);
  addDiagramExtension(extensions, features);
  addTableOfContentsExtension(extensions, features);
  addWikiLinkExtension(extensions, features, flavorConfig);
  addMentionExtension(extensions, features);
  addCommentsExtension(extensions, features);

  // Marks (default on)
  // (underline / superscript / subscript / typography handled inline above)

  // CodeBlock (always-on, async)
  await addCodeBlockExtension(extensions, locale);
```

- [ ] **Step 10: Run typecheck and confirm `base.ts` is clean**

Run: `pnpm typecheck`
Expected: only demo / CT fixture errors remain.

### Task 4: Migrate the React demo app

**Files:**
- Modify: `apps/demo/react/src/App.tsx` (the `features={{…}}` block
  around line 268).

- [ ] **Step 1: Rewrite the `features` literal in `App.tsx`**

Replace the existing object with:

```tsx
              features={{
                content: {
                  mathematics: true,
                  embed: true,
                  details: true,
                  diagram: true,
                  wikiLink: true,
                  callout: true,
                  tableOfContents: true,
                  superscript: true,
                  subscript: true,
                  image: {
                    onUpload: mockUploadImage,
                    maxFileSize: 10 * 1024 * 1024,
                    onValidationError: (error) => {
                      alert(`Validation error: ${error.message}`);
                    },
                    onUploadError: (error) => {
                      alert(`Upload failed: ${error.message}`);
                    },
                  },
                },
                interaction: {
                  typography: true,
                  mention: { items: mockMentionItems },
                },
                collaboration: {
                  comments: true,
                },
              }}
```

Removed (now always-on): `markdown`, `codeBlock`.

- [ ] **Step 2: Run typecheck for the React app**

Run: `pnpm -F demo-react typecheck` (or `pnpm typecheck` for the
workspace).
Expected: React demo is clean.

### Task 5: Migrate the Vue demo app

**Files:**
- Modify: `apps/demo/vue/src/App.vue` (search for `features={{` /
  `:features="…"` block; the surrounding template wires the editor).

- [ ] **Step 1: Apply the same nested-shape rewrite to the Vue template
binding**

The literal mirrors Task 4 exactly. Locate the `:features="…"` or
inline `features="{…}"` declaration and replace with the same nested
object. Vue accepts the literal as a TS expression.

- [ ] **Step 2: Run typecheck for the Vue app**

Run: `pnpm typecheck`
Expected: Vue demo is clean.

### Task 6: Migrate the Svelte demo app

**Files:**
- Modify: `apps/demo/svelte/src/App.svelte` (around line 216, the
  `features={{…}}` block).

- [ ] **Step 1: Apply the same nested-shape rewrite to the Svelte
component binding**

Use the same literal as Task 4. Svelte 5 props accept it directly.

- [ ] **Step 2: Run typecheck for the Svelte app**

Run: `pnpm typecheck`
Expected: Svelte demo is clean.

### Task 7: Migrate Playwright CT fixtures

**Files:**
- Modify: every fixture under `tests/ct/**/specs/*Fixture.*` that
  passes `features`. Concrete set discovered via
  `git grep -nE 'features\\s*[:=]\\s*\\{' tests/ct`.

- [ ] **Step 1: Run the grep to enumerate fixtures**

Run: `git grep -nE 'features\s*[:=]\s*\{' tests/ct`
Expected: a non-empty list of fixture file paths.

- [ ] **Step 2: Rewrite each fixture's `features` object**

For every match, apply the same shape mapping as in Task 4. There is no
short-cut for this — each fixture chooses a different subset, so the
fields differ. The mapping table at the top of this plan is the
authority for which field goes where.

- [ ] **Step 3: Run typecheck for the CT workspace**

Run: `pnpm typecheck`
Expected: CT fixtures are clean.

### Task 8: Run cross-framework parity, lint, and CT

- [ ] **Step 1: Run the parity check**

Run: `pnpm check:parity`
Expected: PASS. The parity script does not look at field-level shapes
of `VizelFeatureOptions`, so the migration is invisible to it.

- [ ] **Step 2: Run lint**

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 3: Run the full CT suite for one framework as a smoke test**

Run: `pnpm test:ct:react`
Expected: PASS. (If it fails on a CT scenario that exercised the old
`features.slashCommand` path through fixture-level config, fix the
fixture — that is the same migration Task 7 already covered.)

### Task 9: Update `.claude/rules/packages/core.md`

**Files:**
- Modify: `.claude/rules/packages/core.md` (the "Extension Catalog"
  table — add a note that Markdown, Link, and CodeBlock are always-on
  and not gated by `features`).

- [ ] **Step 1: Add the always-on note to the catalog**

Append to the catalog section:

```markdown
The following extensions are part of the always-on core and are NOT
gated by `VizelFeatureOptions`: Markdown, Link, CodeBlock. To configure
them, use the corresponding top-level options on `VizelEditorOptions`
(e.g. the Markdown flavor lives at `flavor`, not under `features`).
```

### Task 10: Commit and open the 8a PR

- [ ] **Step 1: Stage and commit on the 8a branch**

```bash
git checkout -b feat/v2-section-08a-features-hierarchy
git add packages/core/src/types.ts \
        packages/core/src/utils/editorHelpers.ts \
        packages/core/src/extensions/base.ts \
        apps/demo/react/src/App.tsx \
        apps/demo/vue/src/App.vue \
        apps/demo/svelte/src/App.svelte \
        tests/ct \
        .claude/rules/packages/core.md
git commit -m "feat: group VizelFeatureOptions into content/interaction/collaboration"
git push -u origin feat/v2-section-08a-features-hierarchy
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat: group VizelFeatureOptions into content/interaction/collaboration" \
  --body-file <(cat <<'EOF'
## Summary

- Restructure `VizelFeatureOptions` into a nested `{ content, interaction, collaboration }` shape per spec Section 8.
- Rename `features.slashCommand` → `features.interaction.slashMenu` and `features.comment` → `features.collaboration.comments` (breaking).
- Move `link`, `markdown`, and `codeBlock` out of `features` into the always-on core (breaking — these are no longer toggleable through `features`).
- Move `underline`, `superscript`, `subscript` out of the always-on base into `features.content.*` (default-on, but now opt-out-able).
- Update React / Vue / Svelte demos and Playwright CT fixtures to the new shape.

## Breaking Changes

- `features.slashCommand` → `features.interaction.slashMenu`
- `features.comment` → `features.collaboration.comments`
- `features.table` → `features.content.table`
- `features.image` → `features.content.image`
- `features.taskList` → `features.content.taskList`
- `features.textColor` → `features.content.textColor`
- `features.mathematics` → `features.content.mathematics`
- `features.embed` → `features.content.embed`
- `features.details` → `features.content.details`
- `features.callout` → `features.content.callout`
- `features.diagram` → `features.content.diagram`
- `features.wikiLink` → `features.content.wikiLink`
- `features.tableOfContents` → `features.content.tableOfContents`
- `features.superscript` → `features.content.superscript`
- `features.subscript` → `features.content.subscript`
- `features.dragHandle` → `features.interaction.dragHandle`
- `features.mention` → `features.interaction.mention`
- `features.characterCount` → `features.interaction.characterCount`
- `features.typography` → `features.interaction.typography`
- `features.collaboration: boolean` → `features.collaboration.provider: boolean` (8e replaces the boolean with a structured provider type)
- `features.link`, `features.markdown`, `features.codeBlock` — REMOVED (always-on)

Subsequent sub-PRs (8b–8f) introduce new fields under the same nested
shape — see `docs/superpowers/plans/2026-05-18-vizel-v2-section-08-feature-grouping.md`.

## Test Plan

- [x] `pnpm typecheck`
- [x] `pnpm check`
- [x] `pnpm check:parity`
- [x] `pnpm test:ct:react`
- [x] Manual: open each demo, verify slash menu / image / table / drag handle / mention still work.
EOF
)"
```

- [ ] **Step 3: Watch CI**

Run: `gh pr checks --watch`
Expected: all checks PASS.

- [ ] **Step 4: Merge after green CI**

```bash
gh pr merge --squash --delete-branch
git checkout main
git pull --ff-only origin main
```

---

## Sub-PR 8b — Highlight independence (placeholder)

Detailed task list will be written into this same plan file when 8a
merges. Scope is bounded by the type-mapping table above
(`content.highlight` line) and the spec Section 8 type signature.

## Sub-PR 8c — Interaction features wire (placeholder)

Detailed task list will be written into this same plan file when 8b
merges.

## Sub-PR 8d — visualHierarchy extension (placeholder)

Detailed task list will be written into this same plan file when 8c
merges.

## Sub-PR 8e — Collaboration grouping (placeholder)

Detailed task list will be written into this same plan file when 8d
merges.

## Sub-PR 8f — Helpers, validation, docs (placeholder)

Detailed task list will be written into this same plan file when 8e
merges.
