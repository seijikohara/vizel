import { test } from "@playwright/experimental-ct-svelte";
import {
  testInlineMathInputRule,
  testInlineMathInsert,
  testKaTeXRendering,
  testMathBlockClickToEdit,
  testMathBlockInsert,
  testMathBlockTyping,
} from "../../scenarios/mathematics.scenario";
import EditorFixture from "./EditorFixture.svelte";

test.describe("Mathematics - Svelte", () => {
  test("math block can be inserted via slash command", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testMathBlockInsert(component, page);
  });

  test("inline math can be inserted via slash command", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testInlineMathInsert(component, page);
  });

  test("math block can be edited by clicking", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testMathBlockClickToEdit(component, page);
  });

  test("LaTeX can be typed in math block", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testMathBlockTyping(component, page);
  });

  test("inline math can be inserted via $...$ syntax", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testInlineMathInputRule(component, page);
  });

  test("KaTeX renders the math expression", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testKaTeXRendering(component, page);
  });
});
