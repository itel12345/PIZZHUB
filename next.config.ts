// next.config.ts
//
// No next.config file existed in the uploaded project, which means
// next/image was almost certainly already broken for any pizza.image
// value pointing at an external host — next/image blocks unconfigured
// remote hosts by default. This adds the one host the new upload
// pipeline can ever produce (res.cloudinary.com).
//
// NOTE: if existing/legacy rows in the Pizza table point at image URLs
// from a different host (e.g. an Unsplash seed dataset), those will
// still 400 in next/image until that host is added here too — I don't
// have visibility into what's actually in the database to enumerate
// them. Check your Pizza rows' `image` column against this list.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Dev-mode only — Next.js 16 blocks cross-origin requests to /_next/*
  // internal assets (JS chunks, HMR, RSC payloads) from any origin not
  // in its built-in localhost allowlist. Without this, testing through
  // a tunnel (localtunnel, ngrok) 403s every client-component chunk
  // request, which is what caused Navbar/Footer/menu-loading to appear
  // broken — the app itself was fine, the dev server just refused to
  // serve its own JS to an origin it didn't recognize. Wildcarded
  // rather than a fixed subdomain since localtunnel/ngrok's free tiers
  // assign a new random subdomain on every restart. Has zero effect on
  // production builds — this option is dev-server-only.
  allowedDevOrigins: ["*.loca.lt", "*.ngrok-free.app", "*.ngrok.io"],
};

export default nextConfig;