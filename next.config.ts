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

// Profile pictures live in a Supabase Storage bucket, so next/image must
// be allowed to load from that project's host. Derived from SUPABASE_URL
// (the same variable the upload code uses) instead of hardcoding a
// project id, and scoped to the public-object path only. Protocol and
// port come from the URL too, so a local Supabase (http, port 54321)
// works as well as the hosted one. If the variable is unset or
// malformed the pattern is simply omitted: avatars then fall back to
// the initial-letter circle rather than breaking the build.
function getSupabaseImagePattern() {
  try {
    if (!process.env.SUPABASE_URL) return null;
    const url = new URL(process.env.SUPABASE_URL);
    return {
      protocol: url.protocol === "http:" ? ("http" as const) : ("https" as const),
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return null;
  }
}

const supabaseImagePattern = getSupabaseImagePattern();

// The exact prefix every stored avatar URL starts with in THIS
// environment. Built the same way lib/avatar.ts builds the URLs it
// saves (SUPABASE_URL without trailing slashes + the public-object path
// + the bucket name), so "starts with this" means "was uploaded to the
// bucket this app is currently configured for". Exposed to the browser
// as NEXT_PUBLIC_AVATAR_PUBLIC_BASE (see lib/avatar-url.ts) so a picture
// URL left over from a different Supabase project (e.g. production
// after switching to dev) can be recognised and not handed to
// next/image. Public by nature — it is already the prefix of every
// avatar URL the browser receives — and contains no key. Empty string
// when SUPABASE_URL is unset or malformed, same condition under which
// the remote pattern above is omitted.
function getAvatarPublicBase() {
  if (!supabaseImagePattern || !process.env.SUPABASE_URL) return "";
  const bucket = process.env.SUPABASE_AVATAR_BUCKET?.trim() || "avatars";
  return `${process.env.SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/`;
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_AVATAR_PUBLIC_BASE: getAvatarPublicBase(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
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
