// src/lib/authConstants.ts
//
// Deliberately has NO imports. src/middleware.ts runs on the Edge
// runtime and needs the admin cookie's name, but importing it from
// src/lib/auth.ts pulls that whole module into the Edge bundle — and
// auth.ts imports Prisma (requireUser re-reads authVersion from the
// database), whose generated client needs Node built-ins (node:path,
// node:url, the pg driver) that the Edge runtime doesn't have.
//
// Anything middleware needs from the auth layer must live here (or in
// lib/edgeJwt.ts), never in lib/auth.ts. lib/auth.ts re-exports this
// constant so every existing `import { ADMIN_SESSION_COOKIE } from
// "@/lib/auth"` in the Node.js API routes keeps working unchanged.

export const ADMIN_SESSION_COOKIE = "admin_session";
