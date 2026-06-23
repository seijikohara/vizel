import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testOutlineClickMovesSelection,
  testOutlineRendersHeadings,
} from "../../scenarios/outline-bc.scenario";
import { OutlineFixture } from "./OutlineFixture";

describe("VizelOutline (Vitest Browser) - React", () => {
  test("renders one entry per heading", async () => {
    await render(<OutlineFixture />);
    await testOutlineRendersHeadings(page.elementLocator(document.body));
  });

  test("clicking an entry moves the selection", async () => {
    await render(<OutlineFixture />);
    await testOutlineClickMovesSelection(page.elementLocator(document.body));
  });
});
