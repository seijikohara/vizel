// V8-specific Error.captureStackTrace (used in VizelError for better stack traces)
interface ErrorConstructor {
  captureStackTrace?(targetObject: object, constructorOpt?: NewableFunction): void;
}

// Build-time process.env.NODE_ENV (replaced by bundlers like Vite, Webpack, Rollup)
declare const process: {
  env: {
    NODE_ENV?: string;
  };
};

// markdown-it plugin packages that ship without TypeScript types.
// These declarations satisfy the type checker; the runtime contract
// is a single default export that conforms to markdown-it's plugin
// signature `(md, options?) => void`.
declare module "markdown-it-deflist" {
  import type MarkdownIt from "markdown-it";

  const plugin: (md: MarkdownIt) => void;
  // biome-ignore lint/style/noDefaultExport: ambient shim mirrors upstream default export
  export default plugin;
}
declare module "markdown-it-sub" {
  import type MarkdownIt from "markdown-it";

  const plugin: (md: MarkdownIt) => void;
  // biome-ignore lint/style/noDefaultExport: ambient shim mirrors upstream default export
  export default plugin;
}
declare module "markdown-it-sup" {
  import type MarkdownIt from "markdown-it";

  const plugin: (md: MarkdownIt) => void;
  // biome-ignore lint/style/noDefaultExport: ambient shim mirrors upstream default export
  export default plugin;
}
