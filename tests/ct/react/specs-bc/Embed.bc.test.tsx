import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testEmbedToggleAppearsForKnownProvider,
  testEmbedToggleHiddenForUnknownProvider,
  testSetLinkAsEmbed,
  testSetLinkWithoutEmbed,
  testSpotifyProviderDetection,
  testTwitterProviderDetection,
  testVimeoProviderDetection,
} from "../../scenarios/embed-bc.scenario";
import { EmbedFixture } from "./EmbedFixture";

describe("Embed (Vitest Browser) - React", () => {
  test("shows embed toggle for known provider URLs (YouTube)", async () => {
    await render(<EmbedFixture />);
    await testEmbedToggleAppearsForKnownProvider(page.elementLocator(document.body));
  });

  test("hides embed toggle for unknown provider URLs", async () => {
    await render(<EmbedFixture />);
    await testEmbedToggleHiddenForUnknownProvider(page.elementLocator(document.body));
  });

  test("sets link as embed when toggle is checked", async () => {
    await render(<EmbedFixture />);
    await testSetLinkAsEmbed(page.elementLocator(document.body));
  });

  test("sets link normally when embed toggle is not checked", async () => {
    await render(<EmbedFixture />);
    await testSetLinkWithoutEmbed(page.elementLocator(document.body));
  });

  test("detects Twitter as known provider", async () => {
    await render(<EmbedFixture />);
    await testTwitterProviderDetection(page.elementLocator(document.body));
  });

  test("detects Vimeo as known provider", async () => {
    await render(<EmbedFixture />);
    await testVimeoProviderDetection(page.elementLocator(document.body));
  });

  test("detects Spotify as known provider", async () => {
    await render(<EmbedFixture />);
    await testSpotifyProviderDetection(page.elementLocator(document.body));
  });
});
