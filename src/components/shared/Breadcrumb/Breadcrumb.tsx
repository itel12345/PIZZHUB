// src/components/shared/Breadcrumb/Breadcrumb.tsx
//
// Reusable breadcrumb trail, e.g. "Home / Menu / Margherita".
// Takes a plain list of { label, href } items — the last item is
// rendered as the current page (no link, aria-current="page").

import Link from "next/link";
import styles from "./Breadcrumb.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string; // omit on the final/current item
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className={styles.item}>
              {!isLast && item.href ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className={styles.separator} aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}