import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";
import {
  testSaveIndicatorCustomClass,
  testSaveIndicatorError,
  testSaveIndicatorHideTimestamp,
  testSaveIndicatorSaved,
  testSaveIndicatorSaving,
  testSaveIndicatorTimestamp,
  testSaveIndicatorUnsaved,
} from "../../scenarios/save-indicator.scenario";
import SaveIndicatorFixture from "./SaveIndicatorFixture.vue";

describe("SaveIndicator (Vitest Browser) - Vue", () => {
  test("renders with saved status", async () => {
    render(SaveIndicatorFixture, { props: { status: "saved" } });
    await testSaveIndicatorSaved();
  });

  test("renders with saving status", async () => {
    render(SaveIndicatorFixture, { props: { status: "saving" } });
    await testSaveIndicatorSaving();
  });

  test("renders with unsaved status", async () => {
    render(SaveIndicatorFixture, { props: { status: "unsaved" } });
    await testSaveIndicatorUnsaved();
  });

  test("renders with error status", async () => {
    render(SaveIndicatorFixture, { props: { status: "error" } });
    await testSaveIndicatorError();
  });

  test("shows timestamp when lastSaved is provided", async () => {
    const lastSaved = new Date();
    render(SaveIndicatorFixture, { props: { status: "saved", lastSaved, showTimestamp: true } });
    await testSaveIndicatorTimestamp();
  });

  test("hides timestamp when showTimestamp is false", async () => {
    const lastSaved = new Date();
    render(SaveIndicatorFixture, { props: { status: "saved", lastSaved, showTimestamp: false } });
    await testSaveIndicatorHideTimestamp();
  });

  test("accepts custom class", async () => {
    render(SaveIndicatorFixture, { props: { status: "saved", class: "my-custom-class" } });
    await testSaveIndicatorCustomClass("my-custom-class");
  });

  test("shows timestamp by default when lastSaved is provided", async () => {
    const lastSaved = new Date();
    render(SaveIndicatorFixture, { props: { status: "saved", lastSaved } });
    await testSaveIndicatorTimestamp();
  });

  test("does not show timestamp when lastSaved is null", async () => {
    render(SaveIndicatorFixture, { props: { status: "saved", lastSaved: null } });
    await testSaveIndicatorHideTimestamp();
  });
});
