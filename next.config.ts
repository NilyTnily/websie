import type { NextConfig } from "next";

export default {
  // Keep native heavy deps out of webpack bundling — they contain .node binaries
  // and ONNX models that must run as external server packages (see table-cutout.ts)
  compress: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-avatar",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-label",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-slider",
      "@radix-ui/react-separator",
      "@radix-ui/react-switch",
      "@radix-ui/react-popover",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Vercel's Image Optimization has a monthly transformation quota; once
    // exhausted, /_next/image returns 402 and every next/image breaks
    // (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED). Bypassing optimization
    // serves the original files directly so images keep loading regardless
    // of quota state, at the cost of no on-the-fly resize/format conversion.
    unoptimized: true,
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
  poweredByHeader: false,
  serverExternalPackages: [
    "@imgly/background-removal-node",
    "sharp",
    "onnxruntime-node",
  ],
} satisfies NextConfig;
