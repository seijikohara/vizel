import { describe, test } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import {
  testInlineMathInputRule,
  testInlineMathInsert,
  testKaTeXRendering,
  testMathBlockClickToEdit,
  testMathBlockInsert,
  testMathBlockTyping,
} from "../../scenarios/mathematics.scenario";
import { EditorFixture } from "./EditorFixture";

describe("Mathematics (Vitest Browser) - React", () => {
  test("math block can be inserted via slash command", async () => {
    await render(<EditorFixture />);
    await testMathBlockInsert(page.elementLocator(document.body));
  });

  test("inline math can be inserted via slash command", async () => {
    await render(<EditorFixture />);
    await testInlineMathInsert(page.elementLocator(document.body));
  });

  test("math block can be edited by clicking", async () => {
    await render(<EditorFixture />);
    await testMathBlockClickToEdit(page.elementLocator(document.body));
  });

  test("LaTeX can be typed in math block", async () => {
    await render(<EditorFixture />);
    await testMathBlockTyping(page.elementLocator(document.body));
  });

  test("inline math can be inserted via $...$ syntax", async () => {
    await render(<EditorFixture />);
    await testInlineMathInputRule(page.elementLocator(document.body));
  });

  test("KaTeX renders the math expression", async () => {
    await render(<EditorFixture />);
    await testKaTeXRendering(page.elementLocator(document.body));
  });
});
