import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testPortalContainerCreated,
  testPortalContentRendered,
  testPortalCustomClass,
  testPortalDisabled,
  testPortalEscapesOverflow,
  testPortalZIndexLayer,
} from "../../scenarios/portal.scenario";
import PortalFixture from "./PortalFixture.svelte";

describe("Portal (Vitest Browser) - Svelte", () => {
  describe("Display", () => {
    test("creates portal container in document.body", async () => {
      render(PortalFixture);
      await testPortalContainerCreated(page.elementLocator(document.body));
    });

    test("renders content in portal container", async () => {
      render(PortalFixture);
      await testPortalContentRendered(page.elementLocator(document.body));
    });

    test("applies custom className", async () => {
      render(PortalFixture, { props: { class: "custom-portal-class" } });
      await testPortalCustomClass(page.elementLocator(document.body));
    });
  });

  describe("Z-Index Layers", () => {
    test("dropdown layer has z-index 50", async () => {
      render(PortalFixture, { props: { layer: "dropdown" } });
      await testPortalZIndexLayer("dropdown");
    });

    test("modal layer has z-index 100", async () => {
      render(PortalFixture, { props: { layer: "modal" } });
      await testPortalZIndexLayer("modal");
    });

    test("tooltip layer has z-index 150", async () => {
      render(PortalFixture, { props: { layer: "tooltip" } });
      await testPortalZIndexLayer("tooltip");
    });
  });

  describe("Disabled Mode", () => {
    test("renders content in place when disabled", async () => {
      render(PortalFixture, { props: { disabled: true } });
      await testPortalDisabled(page.elementLocator(document.body));
    });
  });

  describe("Overflow Container", () => {
    test("content escapes overflow:hidden container", async () => {
      render(PortalFixture, { props: { withOverflowContainer: true } });
      await testPortalEscapesOverflow(page.elementLocator(document.body));
    });
  });
});
