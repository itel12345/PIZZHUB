// src/components/profile/components/ProfileCard.tsx
//
// Single account menu card. Icons are mapped locally from the item's
// `id` — kept out of accountMenuData.ts since icons are a rendering
// concern, not data (see that file's comment for the full reasoning).
// Unavailable items render as a disabled card with a "Soon" tag
// instead of a real link, matching the precedent already established
// by the Settings row in the mobile drawer.

import Link from "next/link";
import type { AccountMenuItem } from "../data/accountMenuData";
import styles from "./ProfileCard.module.css";

interface ProfileCardProps {
  item: AccountMenuItem;
}

export default function ProfileCard({ item }: ProfileCardProps) {
  const icon = ICONS[item.id] ?? <DefaultIcon />;

  const content = (
    <>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.textGroup}>
        <span className={styles.label}>{item.label}</span>
        <span className={styles.description}>{item.description}</span>
      </span>
      {item.isAvailable ? (
        <span className={styles.chevron} aria-hidden="true">
          <ChevronIcon />
        </span>
      ) : (
        <span className={styles.soonTag}>Soon</span>
      )}
    </>
  );

  if (!item.isAvailable) {
    return (
      <button
        type="button"
        className={`${styles.card} ${styles.cardDisabled}`}
        disabled
        aria-label={`${item.label} — coming soon`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href} className={styles.card}>
      {content}
    </Link>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DefaultIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 19.5c1.2-3.3 4-5 7-5s5.8 1.7 7 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 7h12l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-7a1.5 1.5 0 0 1-1.5-1.5L6 7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 7V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-6.3 7-11.5a7 7 0 1 0-14 0C5 14.7 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10.5h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function NotificationsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.8 6.8l1.4 1.4M15.8 15.8l1.4 1.4M6.8 17.2l1.4-1.4M15.8 8.2l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  profile: <ProfileIcon />,
  orders: <OrdersIcon />,
  addresses: <AddressIcon />,
  payment: <PaymentIcon />,
  notifications: <NotificationsIcon />,
  settings: <SettingsIcon />,
};