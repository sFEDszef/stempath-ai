import type { NextConfig } from "next";

// GitHub project Pages is hosted at /stempath-ai/ rather than the domain root.
// Keep the existing root URL for the local development server.
const basePath = process.env.NODE_ENV === "production" ? "/stempath-ai" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Explicitly scope the generated JS and CSS to the same project path.
  assetPrefix: basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
