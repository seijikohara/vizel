import index from "./index.html";

Bun.serve({
  port: 3001,
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("Vue demo server running at http://localhost:3001");
