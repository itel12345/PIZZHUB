/* eslint-disable @typescript-eslint/no-require-imports */
// Test-only. Next.js handles `import "server-only"` itself during builds;
// under plain Node it cannot be resolved. Make it a no-op for the tests.
const Module = require("node:module");
const original = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return require.resolve("./empty.cjs");
  return original.call(this, request, ...rest);
};
