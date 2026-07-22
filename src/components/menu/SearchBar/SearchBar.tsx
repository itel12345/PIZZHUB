// src/components/menu/SearchBar/SearchBar.tsx
// Premium search input: icon, generous padding, clear affordance.

"use client";

import styles from "./SearchBar.module.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M21 21l-4.35-4.35"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>

      <input
        type="text"
        className={styles.input}
        placeholder="Search for a pizza, ingredient…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search the menu"
      />

      {value.length > 0 && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
