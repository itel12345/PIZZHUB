// src/components/auth/types/auth.ts
//
// Shared types for the auth UI. Kept minimal on purpose — this phase is
// frontend-only, so there's no User/Session/Token shape yet. Those get
// added once real authentication (Prisma + Auth.js) lands; nothing here
// needs to change to accommodate that, since AuthView only describes
// which screen is showing, not any auth state itself.

export type AuthView = "login" | "signup" | "forgot-password";

// Matches what useAuthState.ts used to hand out (name, avatarUrl), plus
// id/email since the real /api/auth/login response includes them. name
// stays required since Navbar/MobileNavLinks derive an avatar initial
// from it; everything else is optional so this stays easy to satisfy
// from whatever shape the backend actually returns.
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  /** "ADMIN" unlocks the /admin nav entry; anything else is a regular customer. */
  role?: "USER" | "ADMIN";
}