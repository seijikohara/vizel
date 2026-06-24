import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testVizelBubbleMenuFormatting,
  testVizelBubbleMenuOnSelection,
  testVizelPlaceholder,
  testVizelRenders,
  testVizelSlashMenu,
  testVizelTyping,
  testVizelWithoutBubbleMenu,
} from "../../scenarios/vizel.scenario";
import { VizelFixture } from "./VizelFixture";

describe("Vizel (Vitest Browser) - React", () => {
  test("renders with editor and bubble menu", async () => {
    await render(<VizelFixture />);
    await testVizelRenders(page.elementLocator(document.body));
  });

  test("shows placeholder when empty", async () => {
    await render(<VizelFixture placeholder="Start writing..." />);
    await testVizelPlaceholder("Start writing...");
  });

  test("accepts text input", async () => {
    await render(<VizelFixture />);
    await testVizelTyping(page.elementLocator(document.body));
  });

  test("shows bubble menu on text selection", async () => {
    await render(<VizelFixture />);
    await testVizelBubbleMenuOnSelection(page.elementLocator(document.body));
  });

  test("hides bubble menu when showBubbleMenu is false", async () => {
    await render(<VizelFixture showBubbleMenu={false} />);
    await testVizelWithoutBubbleMenu(page.elementLocator(document.body));
  });

  test("opens slash menu on / key", async () => {
    await render(<VizelFixture />);
    await testVizelSlashMenu(page.elementLocator(document.body));
  });

  test("applies formatting via bubble menu", async () => {
    await render(<VizelFixture />);
    await testVizelBubbleMenuFormatting(page.elementLocator(document.body));
  });
});
