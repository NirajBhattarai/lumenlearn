import type { NextConfig } from "next";

/** Project Pages live at https://<user>.github.io/lumenlearn/ */
const repoName = "lumenlearn";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(isGithubPages ? { basePath: `/${repoName}` } : {}),
};

export default nextConfig;
