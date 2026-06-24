import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testDetailsBlockStructure,
  testDetailsContentEditable,
  testDetailsCssClasses,
  testDetailsInsertedViaSlashCommand,
  testDetailsSummaryEditable,
  testDetailsToggle,
} from "../../scenarios/details.scenario";
import { DetailsFixture } from "./DetailsFixture";

describe("Details (Vitest Browser) - React", () => {
  test("inserts Details via slash command", async () => {
    await render(<DetailsFixture />);
    await testDetailsInsertedViaSlashCommand(page.elementLocator(document.body));
  });

  test("renders Details with correct structure", async () => {
    await render(<DetailsFixture />);
    await testDetailsBlockStructure(page.elementLocator(document.body));
  });

  test("toggles Details open/closed", async () => {
    await render(<DetailsFixture />);
    await testDetailsToggle(page.elementLocator(document.body));
  });

  test("allows editing Details summary", async () => {
    await render(<DetailsFixture />);
    await testDetailsSummaryEditable(page.elementLocator(document.body));
  });

  test("allows editing Details content", async () => {
    await render(<DetailsFixture />);
    await testDetailsContentEditable(page.elementLocator(document.body));
  });

  test("applies correct CSS classes", async () => {
    await render(<DetailsFixture />);
    await testDetailsCssClasses(page.elementLocator(document.body));
  });
});
