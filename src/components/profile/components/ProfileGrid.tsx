// src/components/profile/components/ProfileGrid.tsx
//
// Renders the account menu cards from ACCOUNT_MENU_ITEMS. Adding a
// 7th account feature later (Wishlist, Rewards, etc.) is purely a
// data change in accountMenuData.ts — no JSX here needs to change.

import { ACCOUNT_MENU_ITEMS } from "../data/accountMenuData";
import ProfileCard from "./ProfileCard";
import styles from "./ProfileGrid.module.css";

export default function ProfileGrid() {
  return (
    <ul className={styles.grid}>
      {ACCOUNT_MENU_ITEMS.map((item) => (
        <li key={item.id}>
          <ProfileCard item={item} />
        </li>
      ))}
    </ul>
  );
}