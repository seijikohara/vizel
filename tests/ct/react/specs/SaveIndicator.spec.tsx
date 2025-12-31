import { expect, test } from "@playwright/experimental-ct-react";
import {
  testSaveIndicatorCustomClass,
  testSaveIndicatorHideTimestamp,
  testSaveIndicatorIcons,
  testSaveIndicatorTimestamp,
} from "../../scenarios/save-indicator.scenario";
import { SaveIndicatorFixture } from "./SaveIndicatorFixture";

test.describe("SaveIndicator - React", () => {
  test("renders with saved status", async ({ mount, page }) => {
    const component = await mount(<SaveIndicatorFixture status="saved" />);
    await expect(component).toBeVisible();
    await expect(component).toHaveClass(/vizel-save-indicator--saved/);
    await expect(component).toContainText("Saved");
    await testSaveIndicatorIcons(component, page);
  });

  test("renders with saving status", async ({ mount, page }) => {
    const component = await mount(<SaveIndicatorFixture status="saving" />);
    await expect(component).toBeVisible();
    await expect(component).toHaveClass(/vizel-save-indicator--saving/);
    await expect(component).toContainText("Saving");
    await testSaveIndicatorIcons(component, page);
  });

  test("renders with unsaved status", async ({ mount, page }) => {
    const component = await mount(<SaveIndicatorFixture status="unsaved" />);
    await expect(component).toBeVisible();
    await expect(component).toHaveClass(/vizel-save-indicator--unsaved/);
    await expect(component).toContainText("Unsaved");
    await testSaveIndicatorIcons(component, page);
  });

  test("renders with error status", async ({ mount, page }) => {
    const component = await mount(<SaveIndicatorFixture status="error" />);
    await expect(component).toBeVisible();
    await expect(component).toHaveClass(/vizel-save-indicator--error/);
    await expect(component).toContainText("Error");
    await testSaveIndicatorIcons(component, page);
  });

  test("shows timestamp when lastSaved is provided", async ({ mount, page }) => {
    const lastSaved = new Date();
    const component = await mount(
      <SaveIndicatorFixture status="saved" lastSaved={lastSaved} showTimestamp={true} />
    );
    await testSaveIndicatorTimestamp(component, page);
  });

  test("hides timestamp when showTimestamp is false", async ({ mount, page }) => {
    const lastSaved = new Date();
    const component = await mount(
      <SaveIndicatorFixture status="saved" lastSaved={lastSaved} showTimestamp={false} />
    );
    await testSaveIndicatorHideTimestamp(component, page);
  });

  test("accepts custom className", async ({ mount, page }) => {
    const component = await mount(
      <SaveIndicatorFixture status="saved" className="my-custom-class" />
    );
    await testSaveIndicatorCustomClass(component, page, "my-custom-class");
  });

  test("shows timestamp by default when lastSaved is provided", async ({ mount, page }) => {
    const lastSaved = new Date();
    const component = await mount(<SaveIndicatorFixture status="saved" lastSaved={lastSaved} />);
    await testSaveIndicatorTimestamp(component, page);
  });

  test("does not show timestamp when lastSaved is null", async ({ mount, page }) => {
    const component = await mount(<SaveIndicatorFixture status="saved" lastSaved={null} />);
    await testSaveIndicatorHideTimestamp(component, page);
  });
});
