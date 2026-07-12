import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import {
  testDetailsBlockStructure,
  testDetailsContentEditable,
  testDetailsCssClasses,
  testDetailsInsertedViaSlashCommand,
  testDetailsSummaryEditable,
  testDetailsToggle,
} from "../../scenarios/details.scenario";
import DetailsFixture from "./DetailsFixture.svelte";

describe("Details (Vitest Browser) - Svelte", () => {
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
