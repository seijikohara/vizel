import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import {
  testDetailsBlockStructure,
  testDetailsContentEditable,
  testDetailsCssClasses,
  testDetailsInsertedViaSlashCommand,
  testDetailsSummaryEditable,
  testDetailsToggle,
} from "../../scenarios/details-bc.scenario";
import DetailsFixture from "./DetailsFixture.vue";

describe("Details (Vitest Browser) - Vue", () => {
  test("inserts Details via slash command", async () => {
    render(DetailsFixture);
    await testDetailsInsertedViaSlashCommand(page.elementLocator(document.body));
  });

  test("renders Details with correct structure", async () => {
    render(DetailsFixture);
    await testDetailsBlockStructure(page.elementLocator(document.body));
  });

  test("toggles Details open/closed", async () => {
    render(DetailsFixture);
    await testDetailsToggle(page.elementLocator(document.body));
  });

  test("allows editing Details summary", async () => {
    render(DetailsFixture);
    await testDetailsSummaryEditable(page.elementLocator(document.body));
  });

  test("allows editing Details content", async () => {
    render(DetailsFixture);
    await testDetailsContentEditable(page.elementLocator(document.body));
  });

  test("applies correct CSS classes", async () => {
    render(DetailsFixture);
    await testDetailsCssClasses(page.elementLocator(document.body));
  });
});
