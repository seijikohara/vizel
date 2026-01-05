import { test } from "@playwright/experimental-ct-vue";
import {
  testPortalContainerCreated,
  testPortalContentRendered,
  testPortalCustomClass,
  testPortalDisabled,
  testPortalEscapesOverflow,
  testPortalZIndexLayer,
} from "../../scenarios/portal.scenario";
import PortalFixture from "./PortalFixture.vue";

test.describe("Portal - Vue", () => {
  test.describe("Display", () => {
    test("creates portal container in document.body", async ({ mount, page }) => {
      const component = await mount(PortalFixture);
      await testPortalContainerCreated(component, page);
    });

    test("renders content in portal container", async ({ mount, page }) => {
      const component = await mount(PortalFixture);
      await testPortalContentRendered(component, page);
    });

    test("applies custom className", async ({ mount, page }) => {
      const component = await mount(PortalFixture, {
        props: { class: "custom-portal-class" },
      });
      await testPortalCustomClass(component, page);
    });
  });

  test.describe("Z-Index Layers", () => {
    test("dropdown layer has z-index 50", async ({ mount, page }) => {
      const component = await mount(PortalFixture, {
        props: { layer: "dropdown" },
      });
      await testPortalZIndexLayer(component, page, "dropdown");
    });

    test("modal layer has z-index 100", async ({ mount, page }) => {
      const component = await mount(PortalFixture, {
        props: { layer: "modal" },
      });
      await testPortalZIndexLayer(component, page, "modal");
    });

    test("tooltip layer has z-index 150", async ({ mount, page }) => {
      const component = await mount(PortalFixture, {
        props: { layer: "tooltip" },
      });
      await testPortalZIndexLayer(component, page, "tooltip");
    });
  });

  test.describe("Disabled Mode", () => {
    test("renders content in place when disabled", async ({ mount, page }) => {
      const component = await mount(PortalFixture, {
        props: { disabled: true },
      });
      await testPortalDisabled(component, page);
    });
  });

  test.describe("Overflow Container", () => {
    test("content escapes overflow:hidden container", async ({ mount, page }) => {
      const component = await mount(PortalFixture, {
        props: { withOverflowContainer: true },
      });
      await testPortalEscapesOverflow(component, page);
    });
  });
});
