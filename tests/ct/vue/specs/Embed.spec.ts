import { test } from "@playwright/experimental-ct-vue";
import {
  testEmbedToggleAppearsForKnownProvider,
  testEmbedToggleHiddenForUnknownProvider,
  testSetLinkAsEmbed,
  testSetLinkWithoutEmbed,
  testSpotifyProviderDetection,
  testTwitterProviderDetection,
  testVimeoProviderDetection,
} from "../../scenarios/embed.scenario";
import EmbedFixture from "./EmbedFixture.vue";

test.describe("Embed - Vue", () => {
  test("shows embed toggle for known provider URLs (YouTube)", async ({ mount, page }) => {
    const component = await mount(EmbedFixture);
    await testEmbedToggleAppearsForKnownProvider(component, page);
  });

  test("hides embed toggle for unknown provider URLs", async ({ mount, page }) => {
    const component = await mount(EmbedFixture);
    await testEmbedToggleHiddenForUnknownProvider(component, page);
  });

  test("sets link as embed when toggle is checked", async ({ mount, page }) => {
    const component = await mount(EmbedFixture);
    await testSetLinkAsEmbed(component, page);
  });

  test("sets link normally when embed toggle is not checked", async ({ mount, page }) => {
    const component = await mount(EmbedFixture);
    await testSetLinkWithoutEmbed(component, page);
  });

  test("detects Twitter as known provider", async ({ mount, page }) => {
    const component = await mount(EmbedFixture);
    await testTwitterProviderDetection(component, page);
  });

  test("detects Vimeo as known provider", async ({ mount, page }) => {
    const component = await mount(EmbedFixture);
    await testVimeoProviderDetection(component, page);
  });

  test("detects Spotify as known provider", async ({ mount, page }) => {
    const component = await mount(EmbedFixture);
    await testSpotifyProviderDetection(component, page);
  });
});
