/// <reference types="vite/client" />

declare module "*.md?raw" {
  const content: string;
  // biome-ignore lint/style/noDefaultExport: Vite requires default export for raw imports
  export default content;
}

declare module "*.svg" {
  const src: string;
  // biome-ignore lint/style/noDefaultExport: Vite requires default export for asset imports
  export default src;
}
