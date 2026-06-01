import { test } from "@playwright/experimental-ct-vue";
import {
  testFindReplaceOpens,
  testFindReportsMatchCount,
  testReplaceAll,
  testReplaceButtonsAreLocalized,
  testReplaceOne,
} from "../../scenarios/find-replace.scenario";
import FindReplaceFixture from "./FindReplaceFixture.vue";

test.describe("VizelFindReplace - Vue", () => {
  test("opens the panel in replace mode", async ({ mount, page }) => {
    const component = await mount(FindReplaceFixture);
    await testFindReplaceOpens(component, page);
  });

  test("renders localized replace buttons", async ({ mount, page }) => {
    const component = await mount(FindReplaceFixture);
    await testReplaceButtonsAreLocalized(component, page);
  });

  test("reports the match count", async ({ mount, page }) => {
    const component = await mount(FindReplaceFixture);
    await testFindReportsMatchCount(component, page);
  });

  test("replaces a single match", async ({ mount, page }) => {
    const component = await mount(FindReplaceFixture);
    await testReplaceOne(component, page);
  });

  test("replaces all matches", async ({ mount, page }) => {
    const component = await mount(FindReplaceFixture);
    await testReplaceAll(component, page);
  });
});
