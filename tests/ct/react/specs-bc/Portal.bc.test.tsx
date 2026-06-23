import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testPortalContainerCreated,
  testPortalContentRendered,
  testPortalCustomClass,
  testPortalDisabled,
  testPortalEscapesOverflow,
  testPortalZIndexLayer,
} from "../../scenarios/portal-bc.scenario";
import { PortalFixture } from "./PortalFixture";

describe("Portal (Vitest Browser) - React", () => {
  describe("Display", () => {
    test("creates portal container in document.body", async () => {
      await render(<PortalFixture />);
      await testPortalContainerCreated(page.elementLocator(document.body));
    });

    test("renders content in portal container", async () => {
      await render(<PortalFixture />);
      await testPortalContentRendered(page.elementLocator(document.body));
    });

    test("applies custom className", async () => {
      await render(<PortalFixture className="custom-portal-class" />);
      await testPortalCustomClass(page.elementLocator(document.body));
    });
  });

  describe("Z-Index Layers", () => {
    test("dropdown layer has z-index 50", async () => {
      await render(<PortalFixture layer="dropdown" />);
      await testPortalZIndexLayer("dropdown");
    });

    test("modal layer has z-index 100", async () => {
      await render(<PortalFixture layer="modal" />);
      await testPortalZIndexLayer("modal");
    });

    test("tooltip layer has z-index 150", async () => {
      await render(<PortalFixture layer="tooltip" />);
      await testPortalZIndexLayer("tooltip");
    });
  });

  describe("Disabled Mode", () => {
    test("renders content in place when disabled", async () => {
      await render(<PortalFixture disabled />);
      await testPortalDisabled(page.elementLocator(document.body));
    });
  });

  describe("Overflow Container", () => {
    test("content escapes overflow:hidden container", async () => {
      await render(<PortalFixture withOverflowContainer />);
      await testPortalEscapesOverflow(page.elementLocator(document.body));
    });
  });
});
