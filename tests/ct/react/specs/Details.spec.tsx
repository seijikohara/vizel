import { test } from "@playwright/experimental-ct-react";
import {
  testDetailsBlockStructure,
  testDetailsContentEditable,
  testDetailsCssClasses,
  testDetailsInsertedViaSlashCommand,
  testDetailsSummaryEditable,
  testDetailsToggle,
} from "../../scenarios/details.scenario";
import { DetailsFixture } from "./DetailsFixture";

test.describe("Details - React", () => {
  test("inserts Details via slash command", async ({ mount, page }) => {
    const component = await mount(<DetailsFixture />);
    await testDetailsInsertedViaSlashCommand(component, page);
  });

  test("renders Details with correct structure", async ({ mount, page }) => {
    const component = await mount(<DetailsFixture />);
    await testDetailsBlockStructure(component, page);
  });

  test("toggles Details open/closed", async ({ mount, page }) => {
    const component = await mount(<DetailsFixture />);
    await testDetailsToggle(component, page);
  });

  test("allows editing Details summary", async ({ mount, page }) => {
    const component = await mount(<DetailsFixture />);
    await testDetailsSummaryEditable(component, page);
  });

  test("allows editing Details content", async ({ mount, page }) => {
    const component = await mount(<DetailsFixture />);
    await testDetailsContentEditable(component, page);
  });

  test("applies correct CSS classes", async ({ mount, page }) => {
    const component = await mount(<DetailsFixture />);
    await testDetailsCssClasses(component, page);
  });
});
