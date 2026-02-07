import { withMermaid } from "vitepress-plugin-mermaid";

const siteUrl = "https://seijikohara.github.io/vizel";

export default withMermaid({
  title: "Vizel",
  description:
    "A block-based visual editor for Markdown built with Tiptap, supporting React, Vue, and Svelte",
  base: "/vizel/",
  lang: "en-US",

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/vizel/logo.svg" }],
    ["meta", { name: "theme-color", content: "#6366F1" }],
  ],

  sitemap: {
    hostname: "https://seijikohara.github.io",
    transformItems: (items) => {
      return items.map((item) => {
        // Add base path to URL
        const url = `vizel/${item.url}`;

        if (item.url === "" || item.url === "index.html") {
          return { ...item, url, priority: 1.0, changefreq: "weekly" };
        }
        if (item.url.startsWith("guide/")) {
          return { ...item, url, priority: 0.8, changefreq: "weekly" };
        }
        if (item.url.startsWith("api/")) {
          return { ...item, url, priority: 0.6, changefreq: "monthly" };
        }
        return { ...item, url, priority: 0.5, changefreq: "monthly" };
      });
    },
  },

  transformPageData(pageData) {
    const ogImage = `${siteUrl}/og-image.png`;
    const pageUrl = `${siteUrl}/${pageData.relativePath
      .replace(/index\.md$/, "")
      .replace(/\.md$/, ".html")}`;

    const title = pageData.title
      ? `${pageData.title} | Vizel`
      : "Vizel - Block-based Visual Editor";
    const description =
      pageData.description ||
      "A block-based visual editor for Markdown built with Tiptap, supporting React, Vue, and Svelte";

    pageData.frontmatter.head ??= [];

    // Canonical URL
    pageData.frontmatter.head.push(["link", { rel: "canonical", href: pageUrl }]);

    // Open Graph
    pageData.frontmatter.head.push(
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:url", content: pageUrl }],
      ["meta", { property: "og:image", content: ogImage }],
      ["meta", { property: "og:site_name", content: "Vizel" }]
    );

    // Twitter Cards
    pageData.frontmatter.head.push(
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
      ["meta", { name: "twitter:image", content: ogImage }]
    );

    // JSON-LD Structured Data
    if (pageData.relativePath === "index.md") {
      const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Vizel",
        description:
          "A block-based visual editor for Markdown built with Tiptap, supporting React, Vue, and Svelte",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@type": "Person", name: "Seiji Kohara" },
        license: "https://opensource.org/licenses/MIT",
        url: siteUrl,
        codeRepository: "https://github.com/seijikohara/vizel",
      };

      pageData.frontmatter.head.push([
        "script",
        { type: "application/ld+json" },
        JSON.stringify(softwareSchema),
      ]);
    } else {
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: pageData.title || "Vizel Documentation",
        description: pageData.description || "Vizel documentation page",
        author: { "@type": "Person", name: "Seiji Kohara" },
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      };

      pageData.frontmatter.head.push([
        "script",
        { type: "application/ld+json" },
        JSON.stringify(articleSchema),
      ]);
    }
  },

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
            { text: "Plugins", link: "/guide/plugins" },
            { text: "Wiki Links", link: "/guide/wiki-links" },
            { text: "Version History", link: "/guide/version-history" },
            { text: "Comments", link: "/guide/comments" },
            { text: "Performance", link: "/guide/performance" },
            { text: "Accessibility", link: "/guide/accessibility" },
            { text: "Troubleshooting", link: "/guide/troubleshooting" },
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
