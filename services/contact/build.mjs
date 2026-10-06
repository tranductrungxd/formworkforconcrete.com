// Bundles the contact Lambda into services/contact/dist/index.mjs. Terraform zips that file.
// The AWS SDK clients are bundled too, so the function does not depend on what the runtime ships.
import { build } from "esbuild";

await build({
  entryPoints: ["services/contact/src/index.ts"],
  outfile: "services/contact/dist/index.mjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  minify: false,
  sourcemap: false,
  // Some SDK dependencies still call require(); give the ESM bundle one.
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
  logLevel: "info",
});
