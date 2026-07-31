// src/components/profile/data/accountMenuData.ts
//
// The account menu items are rendered in TWO places — the desktop
// Profile dashboard (ProfileGrid) and the mobile account panel
// (inside MobileNavLinks) — so the list lives here once, as plain
// data, rather than being duplicated in JSX in both places. Icons are
// deliberately NOT stored here (kept as plain, serializable data,
// matching the convention already used by aboutData.ts/contactData.ts);
// each consumer maps `id` to its own local icon component, since icons
// are a rendering concern, not data.
//
// `isAvailable: false` items render as disabled "Soon" rows — same
// precedent already established for the Settings row in MobileNavLinks
// before this phase. `href` points at /profile for all items for now
// since that's the only real destination that exists; give each item
// (Orders, Saved Addresses, Payment Methods, Notifications, Settings)
// its own route later and only this file changes.

export interface AccountMenuItem {
  id: string;
  label: string;
  description: string;
  href: string;
  isAvailable: boolean;
}

export const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
  {
    id: "profile",
    label: "My Profile",
    description: "Your personal details and account information",
    href: "/profile",
    isAvailable: true,
  },
  {
    id: "orders",
    label: "Orders",
    description: "Track current orders and review past ones",
    href: "/profile",
    isAvailable: false,
  },
  {
    id: "addresses",
    label: "Saved Addresses",
    description: "Manage where PizzHub delivers to",
    href: "/profile",
    isAvailable: false,
  },
  {
    id: "payment",
    label: "Payment Methods",
    description: "Manage saved cards and payment options",
    href: "/profile",
    isAvailable: false,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Choose what PizzHub can notify you about",
    href: "/profile",
    isAvailable: false,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Account preferences and app settings",
    href: "/profile",
    isAvailable: false,
  },
];