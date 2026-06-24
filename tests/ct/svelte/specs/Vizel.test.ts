import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testVizelBubbleMenuFormatting,
  testVizelBubbleMenuOnSelection,
  testVizelPlaceholder,
  testVizelRenders,
  testVizelSlashMenu,
  testVizelTyping,
  testVizelWithoutBubbleMenu,
} from "../../scenarios/vizel.scenario";
import VizelFixture from "./VizelFixture.svelte";

describe("Vizel (Vitest Browser) - Svelte", () => {
  test("renders with editor and bubble menu", async () => {
    render(VizelFixture);
    await testVizelRenders(page.elementLocator(document.body));
  });

  test("shows placeholder when empty", async () => {
    render(VizelFixture, { props: { placeholder: "Start writing..." } });
    await testVizelPlaceholder("Start writing...");
  });

  test("accepts text input", async () => {
    render(VizelFixture);
    await testVizelTyping(page.elementLocator(document.body));
  });

  test("shows bubble menu on text selection", async () => {
    render(VizelFixture);
    await testVizelBubbleMenuOnSelection(page.elementLocator(document.body));
  });

  test("hides bubble menu when showBubbleMenu is false", async () => {
    render(VizelFixture, { props: { showBubbleMenu: false } });
    await testVizelWithoutBubbleMenu(page.elementLocator(document.body));
  });

  test("opens slash menu on / key", async () => {
    render(VizelFixture);
    await testVizelSlashMenu(page.elementLocator(document.body));
  });

  test("applies formatting via bubble menu", async () => {
    render(VizelFixture);
    await testVizelBubbleMenuFormatting(page.elementLocator(document.body));
  });
});
