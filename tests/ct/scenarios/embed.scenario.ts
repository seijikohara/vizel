import { expect } from "vitest";

import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously,
// so poll until the element appears with a generous budget for the nine-instance
// parallel matrix.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Type text into the editor and select it all, which triggers the bubble menu
// to appear. Every embed scenario starts from a fresh selection so the bubble
// menu link button is reachable.
async function selectTextInEditor(): Promise<void> {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("Check this link");
  await pressKeyChord("Mod", "a");
}

// Open the link editor by clicking the bubble menu link button. The bubble
// menu renders to document.body as a portal, so the selector queries the
// document rather than the fixture root.
async function openLinkEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector("[data-vizel-bubble-menu]"), { timeout: 5_000 })
    .not.toBeNull();
  const bubbleMenu = document.querySelector<HTMLElement>("[data-vizel-bubble-menu]");
  if (bubbleMenu === null) throw new Error("expected [data-vizel-bubble-menu]");
  const linkBtn = bubbleMenu.querySelector<HTMLElement>('[data-action="link"]');
  if (linkBtn === null) throw new Error('expected [data-action="link"] in bubble menu');
  await userEvent.click(page.elementLocator(linkBtn));

  await expect
    .poll(() => document.querySelector(".vizel-link-editor"), { timeout: 5_000 })
    .not.toBeNull();
  const linkEditor = document.querySelector<HTMLElement>(".vizel-link-editor");
  if (linkEditor === null) throw new Error("expected .vizel-link-editor");
  return linkEditor;
}

/** Verify the embed toggle appears when a known provider URL (YouTube) is entered. */
export const testEmbedToggleAppearsForKnownProvider: VizelBcScenario = async () => {
  await selectTextInEditor();
  const linkEditor = await openLinkEditor();

  const urlInput = linkEditor.querySelector<HTMLElement>(".vizel-link-input");
  if (urlInput === null) throw new Error("expected .vizel-link-input");
  await userEvent.fill(
    page.elementLocator(urlInput),
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  );

  await expect
    .poll(() => linkEditor.querySelector(".vizel-link-editor-embed-toggle"), { timeout: 5_000 })
    .not.toBeNull();
  const embedToggle = linkEditor.querySelector<HTMLElement>(".vizel-link-editor-embed-toggle");
  if (embedToggle === null) throw new Error("expected .vizel-link-editor-embed-toggle");
  await expect.element(page.elementLocator(embedToggle)).toBeVisible();
};

/** Verify the embed toggle does not appear for an unknown provider URL. */
export const testEmbedToggleHiddenForUnknownProvider: VizelBcScenario = async () => {
  await selectTextInEditor();
  const linkEditor = await openLinkEditor();

  const urlInput = linkEditor.querySelector<HTMLElement>(".vizel-link-input");
  if (urlInput === null) throw new Error("expected .vizel-link-input");
  await userEvent.fill(page.elementLocator(urlInput), "https://example.com");

  // Allow a short poll window for reactivity to settle, then assert absence.
  await expect
    .poll(() => linkEditor.querySelector(".vizel-link-editor-embed-toggle") === null, {
      timeout: 3_000,
    })
    .toBe(true);
};

/** Verify that checking the embed toggle and submitting creates an embed node. */
export const testSetLinkAsEmbed: VizelBcScenario = async () => {
  await selectTextInEditor();
  const linkEditor = await openLinkEditor();

  const urlInput = linkEditor.querySelector<HTMLElement>(".vizel-link-input");
  if (urlInput === null) throw new Error("expected .vizel-link-input");
  await userEvent.fill(
    page.elementLocator(urlInput),
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  );

  // The embed toggle checkbox enables embed mode; check it before submitting.
  await expect
    .poll(() => linkEditor.querySelector(".vizel-link-editor-embed-toggle input"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const embedCheckbox = linkEditor.querySelector<HTMLElement>(
    ".vizel-link-editor-embed-toggle input"
  );
  if (embedCheckbox === null) throw new Error("expected embed toggle input");
  await userEvent.click(page.elementLocator(embedCheckbox));

  const submitBtn = linkEditor.querySelector<HTMLElement>('button[type="submit"]');
  if (submitBtn === null) throw new Error('expected button[type="submit"] in link editor');
  await userEvent.click(page.elementLocator(submitBtn));

  // The link editor should close after submission.
  await expect
    .poll(() => document.querySelector(".vizel-link-editor"), { timeout: 5_000 })
    .toBeNull();

  // An embed node must appear in the editor.
  const editorEl = await resolveEditor();
  await expect
    .poll(() => editorEl.querySelector('[data-vizel-embed="true"]'), { timeout: 5_000 })
    .not.toBeNull();
  const embed = editorEl.querySelector<HTMLElement>('[data-vizel-embed="true"]');
  if (embed === null) throw new Error('expected [data-vizel-embed="true"]');
  await expect.element(page.elementLocator(embed)).toBeVisible();
};

/** Verify that submitting without the embed toggle creates a plain link, not an embed node. */
export const testSetLinkWithoutEmbed: VizelBcScenario = async () => {
  await selectTextInEditor();
  const linkEditor = await openLinkEditor();

  const urlInput = linkEditor.querySelector<HTMLElement>(".vizel-link-input");
  if (urlInput === null) throw new Error("expected .vizel-link-input");
  await userEvent.fill(
    page.elementLocator(urlInput),
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  );

  // Submit without enabling the embed toggle so a plain link is created.
  const submitBtn = linkEditor.querySelector<HTMLElement>('button[type="submit"]');
  if (submitBtn === null) throw new Error('expected button[type="submit"] in link editor');
  await userEvent.click(page.elementLocator(submitBtn));

  await expect
    .poll(() => document.querySelector(".vizel-link-editor"), { timeout: 5_000 })
    .toBeNull();

  const editorEl = await resolveEditor();
  await expect.poll(() => editorEl.querySelector("a"), { timeout: 5_000 }).not.toBeNull();
  const link = editorEl.querySelector<HTMLAnchorElement>("a");
  if (link === null) throw new Error("expected <a> in editor");
  expect(link.getAttribute("href")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  // No embed node must exist after a plain-link submission.
  await expect
    .poll(() => editorEl.querySelector('[data-vizel-embed="true"]') === null, { timeout: 3_000 })
    .toBe(true);
};

/** Verify that a Twitter URL is recognized as a known provider. */
export const testTwitterProviderDetection: VizelBcScenario = async () => {
  await selectTextInEditor();
  const linkEditor = await openLinkEditor();

  const urlInput = linkEditor.querySelector<HTMLElement>(".vizel-link-input");
  if (urlInput === null) throw new Error("expected .vizel-link-input");
  await userEvent.fill(page.elementLocator(urlInput), "https://twitter.com/user/status/1234567890");

  await expect
    .poll(() => linkEditor.querySelector(".vizel-link-editor-embed-toggle"), { timeout: 5_000 })
    .not.toBeNull();
  const embedToggle = linkEditor.querySelector<HTMLElement>(".vizel-link-editor-embed-toggle");
  if (embedToggle === null) throw new Error("expected .vizel-link-editor-embed-toggle");
  await expect.element(page.elementLocator(embedToggle)).toBeVisible();
};

/** Verify that a Vimeo URL is recognized as a known provider. */
export const testVimeoProviderDetection: VizelBcScenario = async () => {
  await selectTextInEditor();
  const linkEditor = await openLinkEditor();

  const urlInput = linkEditor.querySelector<HTMLElement>(".vizel-link-input");
  if (urlInput === null) throw new Error("expected .vizel-link-input");
  await userEvent.fill(page.elementLocator(urlInput), "https://vimeo.com/123456789");

  await expect
    .poll(() => linkEditor.querySelector(".vizel-link-editor-embed-toggle"), { timeout: 5_000 })
    .not.toBeNull();
  const embedToggle = linkEditor.querySelector<HTMLElement>(".vizel-link-editor-embed-toggle");
  if (embedToggle === null) throw new Error("expected .vizel-link-editor-embed-toggle");
  await expect.element(page.elementLocator(embedToggle)).toBeVisible();
};

/** Verify that a Spotify URL is recognized as a known provider. */
export const testSpotifyProviderDetection: VizelBcScenario = async () => {
  await selectTextInEditor();
  const linkEditor = await openLinkEditor();

  const urlInput = linkEditor.querySelector<HTMLElement>(".vizel-link-input");
  if (urlInput === null) throw new Error("expected .vizel-link-input");
  await userEvent.fill(page.elementLocator(urlInput), "https://open.spotify.com/track/abc123");

  await expect
    .poll(() => linkEditor.querySelector(".vizel-link-editor-embed-toggle"), { timeout: 5_000 })
    .not.toBeNull();
  const embedToggle = linkEditor.querySelector<HTMLElement>(".vizel-link-editor-embed-toggle");
  if (embedToggle === null) throw new Error("expected .vizel-link-editor-embed-toggle");
  await expect.element(page.elementLocator(embedToggle)).toBeVisible();
};
