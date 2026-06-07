// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const cloudflareDeploy = process.env.DEPLOY_TARGET === "cloudflare";

export default defineConfig({
  nitro: cloudflareDeploy
    ? {
        preset: "cloudflare_module",
        cloudflare: { deployConfig: true, nodeCompat: true },
      }
    : {
        preset: "node-server",
      },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      // cloudflare:workers is only available at Workers runtime, not during build.
      // Externalize it to prevent Rollup from trying to resolve the import.
      external: ["cloudflare:workers"],
    },
  },
});
