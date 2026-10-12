"use client";

import Link from "next/link";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import styles from "./Navbar.module.css";

/**
 * NavbarLogo
 *
 * Renders the store's wordmark, read from live Settings (storeName)
 * instead of a hardcoded string, as a link back to the homepage. Only
 * the LAST word of the name gets the accent-color treatment — matches
 * the original "Pizza[Hub]" split visually for any name, not just the
 * literal word "PizzHub".
 */
export default function NavbarLogo() {
  const { storeName } = usePublicSettings();

  const words = storeName.trim().split(/\s+/);
  const lastWord = words.pop() ?? "";
  const leadingText = words.join(" ");

  return (
    <Link href="/" className={styles.logo}>
      {leadingText ? `${leadingText} ` : null}
      <span className={styles.logoAccent}>{lastWord}</span>
    </Link>
  );
}