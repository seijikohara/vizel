import { fileURLToPath } from "node:url";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid({
  vite: {
    resolve: {
      alias: {
        "@vizel/vue": fileURLToPath(new URL("../../packages/vue/src/index.ts", import.meta.url)),
        "@vizel/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      },
    },
    ssr: {
      noExternal: ["@vizel/vue", "@vizel/core"],
    },
  },

  title: "Vizel",
  description:
    "A block-based visual editor for Markdown built with Tiptap, supporting React, Vue, and Svelte",
  base: "/vizel/",

  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/vizel/logo.svg" }]],

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" },
      { text: "Demo", link: "/demo/" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Vizel?", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
          ],
        },
        {
          text: "Essentials",
          items: [
            { text: "Configuration", link: "/guide/configuration" },
            { text: "Features", link: "/guide/features" },
            { text: "Theming", link: "/guide/theming" },
            { text: "Auto-Save", link: "/guide/auto-save" },
          ],
        },
        {
          text: "Frameworks",
          items: [
            { text: "React", link: "/guide/react" },
            { text: "Vue", link: "/guide/vue" },
            { text: "Svelte", link: "/guide/svelte" },
          ],
        },
      ],
      "/api/": [
        {
          text: "Reference",
          items: [{ text: "Overview", link: "/api/" }],
        },
        {
          text: "CSS Variables",
          collapsed: false,
          items: [
            { text: "Overview", link: "/api/css-variables/" },
            { text: "Colors", link: "/api/css-variables/colors" },
            { text: "Typography", link: "/api/css-variables/typography" },
            { text: "Spacing & Layout", link: "/api/css-variables/spacing" },
            { text: "Components", link: "/api/css-variables/components" },
            { text: "Integrations", link: "/api/css-variables/integrations" },
          ],
        },
        {
          text: "Type Definitions",
          collapsed: false,
          items: [
            { text: "Overview", link: "/api/types/" },
            { text: "Editor Types", link: "/api/types/editor" },
            { text: "Feature Options", link: "/api/types/features" },
          ],
        },
        {
          text: "Packages",
          items: [
            { text: "@vizel/core", link: "/api/core" },
            { text: "@vizel/react", link: "/api/react" },
            { text: "@vizel/vue", link: "/api/vue" },
            { text: "@vizel/svelte", link: "/api/svelte" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/seijikohara/vizel" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Seiji Kohara",
    },

    search: {
      provider: "local",
    },

    outline: {
      level: [2, 3],
    },

    editLink: {
      pattern: "https://github.com/seijikohara/vizel/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    lastUpdated: {
      text: "Last updated",
    },
  },

  lastUpdated: true,

  // Mermaid configuration
  mermaid: {
    theme: "neutral",
  },

  // Mermaid plugin configuration
  mermaidPlugin: {
    class: "mermaid",
  },
});
