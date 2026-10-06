import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` writes the whole site to out/, which Amplify hosts as a static app (platform WEB).
  // Amplify's server-side hosting officially covers Next.js 12 to 15 only, and the pages need no server.
  output: "export",
  // Every indexed URL ends with "/", so out/<path>/index.html is required.
  trailingSlash: true,
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    // Fewer distinct widths = fewer Cloudinary derivations to generate and cache.
    deviceSizes: [480, 768, 1024, 1440, 1920],
    imageSizes: [48, 96, 160, 256, 384],
  },
};

export default nextConfig;
