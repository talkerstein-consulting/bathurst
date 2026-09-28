import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR lets a second dev server run beside the first (Next allows one `next dev` per build folder)
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
