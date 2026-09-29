// @lovable.dev/vite-tanstack-config already includes the required TanStack/Vite plugins.
// Keep this wrapper to preserve the current local/Lovable setup.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  // GitHub Pages is static hosting, so the Pages build uses TanStack Start SPA mode
  // and prerenders a static shell. Local/Render builds keep the server build.
  nitro: isGitHubPages ? false : undefined,

  vite: {
    // Repository Pages uses /paws-main-india-new/. When we later attach the
    // custom domain, this automatically becomes "/" for that deployment.
    base: isGitHubPages ? "/paws-main-india-new/" : "/",
  },

  tanstackStart: isGitHubPages
    ? {
        spa: {
          enabled: true,
          prerender: {
            outputPath: "/index.html",
            crawlLinks: false,
            retryCount: 2,
            failOnError: true,
          },
        },
      }
    : {
        server: { entry: "server" },
      },
});
