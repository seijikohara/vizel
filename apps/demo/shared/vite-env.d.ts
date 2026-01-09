/// <reference types="vite/client" />

declare module "*.md?raw" {
  const content: string;
  // biome-ignore lint/style/noDefaultExport: Vite requires default export for raw imports
  export default content;
}
