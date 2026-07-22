// src/components/layout/NavActions/index.ts
// NOTE: NavActions.tsx (the combined Login/SignUp <-> Favorites/Cart/Avatar
// wrapper) is no longer used — Navbar.tsx composes FavoritesButton,
// CartButton, and AvatarButton directly so it can keep using the existing
// NavbarLoginButton/NavbarSignupButton/NavbarCTA components for the
// logged-out state instead of duplicating that markup. That file can be
// deleted; it's kept here only if you want the all-in-one version for
// some other entry point.
export { default as MobileNavLinks } from "./MobileNavLinks";
export { default as FavoritesButton } from "./FavoritesButton";
export { default as CartButton } from "./CartButton";
export { default as AvatarButton } from "./AvatarButton";
export { useAuthState } from "./useAuthState";
export { useNavCounts } from "./useNavCounts";
export type { AuthUser, AuthState } from "./useAuthState";