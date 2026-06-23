import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testFindReplaceOpens,
  testFindReportsMatchCount,
  testReplaceAll,
  testReplaceButtonsAreLocalized,
  testReplaceOne,
} from "../../scenarios/find-replace.scenario";
import FindReplaceFixture from "./FindReplaceFixture.svelte";

describe("VizelFindReplace (Vitest Browser) - Svelte", () => {
  test("opens the panel in replace mode", async () => {
    render(FindReplaceFixture);
    await testFindReplaceOpens(page.elementLocator(document.body));
  });

  test("renders localized replace buttons", async () => {
    render(FindReplaceFixture);
    await testReplaceButtonsAreLocalized(page.elementLocator(document.body));
  });

  test("reports the match count", async () => {
    render(FindReplaceFixture);
    await testFindReportsMatchCount(page.elementLocator(document.body));
  });

  test("replaces a single match", async () => {
    render(FindReplaceFixture);
    await testReplaceOne(page.elementLocator(document.body));
  });

  test("replaces all matches", async () => {
    render(FindReplaceFixture);
    await testReplaceAll(page.elementLocator(document.body));
  });
});
