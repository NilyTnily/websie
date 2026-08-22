import type { NextConfig } from "next";

export default {
  // Keep native heavy deps out of webpack bundling — they contain .node binaries
  // and ONNX models that must run as external server packages (see table-cutout.ts)
  serverExternalPackages: [
    "@imgly/background-removal-node",
    "sharp",
    "onnxruntime-node",
  ],
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { hostname: "**.githubassets.com", protocol: "https" },
      { hostname: "**.githubusercontent.com", protocol: "https" },
      { hostname: "**.googleusercontent.com", protocol: "https" },
      { hostname: "**.thewatchpages.com", protocol: "https" },
      { hostname: "**.ufs.sh", protocol: "https" },
      { hostname: "**.unsplash.com", protocol: "https" },
      { hostname: "api.github.com", protocol: "https" },
      { hostname: "utfs.io", protocol: "https" },
    ],
  },
} satisfies NextConfig;
