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
// `isAvailable: false` would render as a disabled "Soon" row (see
// MobileNavLinks) — every item below now has a real route, so nothing
// currently uses that state, but the rendering support stays in place
// for whatever gets added next.

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
    href: "/profile/orders",
    isAvailable: true,
  },
  {
    id: "addresses",
    label: "Saved Addresses",
    description: "Manage where PizzHub delivers to",
    href: "/profile/addresses",
    isAvailable: true,
  },
  {
    id: "payment",
    label: "Payment Methods",
    description: "See which payment options are currently accepted",
    href: "/profile/payments",
    isAvailable: true,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Updates about your orders and payments",
    href: "/profile/notifications",
    isAvailable: true,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Account preferences and app settings",
    href: "/profile/settings",
    isAvailable: true,
  },
];