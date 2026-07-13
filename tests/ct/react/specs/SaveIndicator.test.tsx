import { describe, test } from "vitest";
import { render } from "vitest-browser-react";

import {
  testSaveIndicatorCustomClass,
  testSaveIndicatorError,
  testSaveIndicatorHideTimestamp,
  testSaveIndicatorSaved,
  testSaveIndicatorSaving,
  testSaveIndicatorTimestamp,
  testSaveIndicatorUnsaved,
} from "../../scenarios/save-indicator.scenario";
import { SaveIndicatorFixture } from "./SaveIndicatorFixture";

describe("SaveIndicator (Vitest Browser) - React", () => {
  test("renders with saved status", async () => {
    await render(<SaveIndicatorFixture status="saved" />);
    await testSaveIndicatorSaved();
  });

  test("renders with saving status", async () => {
    await render(<SaveIndicatorFixture status="saving" />);
    await testSaveIndicatorSaving();
  });

  test("renders with unsaved status", async () => {
    await render(<SaveIndicatorFixture status="unsaved" />);
    await testSaveIndicatorUnsaved();
  });

  test("renders with error status", async () => {
    await render(<SaveIndicatorFixture status="error" />);
    await testSaveIndicatorError();
  });

  test("shows timestamp when lastSaved is provided", async () => {
    const lastSaved = new Date();
    await render(
      <SaveIndicatorFixture status="saved" lastSaved={lastSaved} showTimestamp={true} />
    );
    await testSaveIndicatorTimestamp();
  });

  test("hides timestamp when showTimestamp is false", async () => {
    const lastSaved = new Date();
    await render(
      <SaveIndicatorFixture status="saved" lastSaved={lastSaved} showTimestamp={false} />
    );
    await testSaveIndicatorHideTimestamp();
  });

  test("accepts custom className", async () => {
    await render(<SaveIndicatorFixture status="saved" className="my-custom-class" />);
    await testSaveIndicatorCustomClass("my-custom-class");
  });

  test("shows timestamp by default when lastSaved is provided", async () => {
    const lastSaved = new Date();
    await render(<SaveIndicatorFixture status="saved" lastSaved={lastSaved} />);
    await testSaveIndicatorTimestamp();
  });

  test("does not show timestamp when lastSaved is null", async () => {
    await render(<SaveIndicatorFixture status="saved" lastSaved={null} />);
    await testSaveIndicatorHideTimestamp();
  });
});
