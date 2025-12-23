import index from "./index.html";

Bun.serve({
  port: 3002,
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("Svelte demo server running at http://localhost:3002");
