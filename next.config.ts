import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR lets a second dev server run beside the first (Next allows one `next dev` per build folder)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async rewrites() {
    return {
      beforeFiles: [{
        source: "/",
        has: [{ type: "host", value: "tcg2027\\.vercel\\.app" }],
        destination: "/chatbot",
      }],
      afterFiles: [],
      fallback: [],
    };
  },
  // the terminal's answers read the knowledge base Markdown at runtime (lib/terminal/knowledge.ts): ship it with that function
  outputFileTracingIncludes: {
    "/api/chatbot": ["./lib/chatbot/instructions.md"],
    "/api/terminal": ["./research/canadian-sme-knowledge-base/**/*.md"],
  },
};

export default nextConfig;
