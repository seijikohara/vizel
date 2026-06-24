import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testFindReplaceOpens,
  testFindReportsMatchCount,
  testReplaceAll,
  testReplaceButtonsAreLocalized,
  testReplaceOne,
} from "../../scenarios/find-replace.scenario";
import { FindReplaceFixture } from "./FindReplaceFixture";

describe("VizelFindReplace (Vitest Browser) - React", () => {
  test("opens the panel in replace mode", async () => {
    await render(<FindReplaceFixture />);
    await testFindReplaceOpens(page.elementLocator(document.body));
  });

  test("renders localized replace buttons", async () => {
    await render(<FindReplaceFixture />);
    await testReplaceButtonsAreLocalized(page.elementLocator(document.body));
  });

  test("reports the match count", async () => {
    await render(<FindReplaceFixture />);
    await testFindReportsMatchCount(page.elementLocator(document.body));
  });

  test("replaces a single match", async () => {
    await render(<FindReplaceFixture />);
    await testReplaceOne(page.elementLocator(document.body));
  });

  test("replaces all matches", async () => {
    await render(<FindReplaceFixture />);
    await testReplaceAll(page.elementLocator(document.body));
  });
});
