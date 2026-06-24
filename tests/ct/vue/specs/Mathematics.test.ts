import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import {
  testInlineMathInputRule,
  testInlineMathInsert,
  testKaTeXRendering,
  testMathBlockClickToEdit,
  testMathBlockInsert,
  testMathBlockTyping,
} from "../../scenarios/mathematics.scenario";
import EditorFixture from "./EditorFixture.vue";

describe("Mathematics (Vitest Browser) - Vue", () => {
  test("math block can be inserted via slash command", async () => {
    render(EditorFixture);
    await testMathBlockInsert(page.elementLocator(document.body));
  });

  test("inline math can be inserted via slash command", async () => {
    render(EditorFixture);
    await testInlineMathInsert(page.elementLocator(document.body));
  });

  test("math block can be edited by clicking", async () => {
    render(EditorFixture);
    await testMathBlockClickToEdit(page.elementLocator(document.body));
  });

  test("LaTeX can be typed in math block", async () => {
    render(EditorFixture);
    await testMathBlockTyping(page.elementLocator(document.body));
  });

  test("inline math can be inserted via $...$ syntax", async () => {
    render(EditorFixture);
    await testInlineMathInputRule(page.elementLocator(document.body));
  });

  test("KaTeX renders the math expression", async () => {
    render(EditorFixture);
    await testKaTeXRendering(page.elementLocator(document.body));
  });
});
