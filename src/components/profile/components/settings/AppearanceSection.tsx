// src/components/profile/components/settings/AppearanceSection.tsx
//
// Purely client-side — useTheme (src/components/theme) writes straight
// to the DOM attribute + localStorage on every change, there's no
// server round-trip and nothing to load, so unlike the other three
// sections this one has no loading/error state at all.

"use client";

import { useTheme } from "@/components/theme";
import styles from "./SettingsSection.module.css";

const THEME_OPTIONS = [
  { value: "dark", label: "Dark", description: "The default PizzHub look." },
  { value: "light", label: "Light", description: "A brighter, high-contrast canvas." },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <section className={styles.panel} aria-labelledby="appearance-heading">
      <h2 id="appearance-heading" className={styles.heading}>
        Appearance
      </h2>
      <p className={styles.description}>Choose how PizzHub looks on this device.</p>

      <div className={styles.themeOptions} role="radiogroup" aria-labelledby="appearance-heading">
        {THEME_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`${styles.themeOption} ${theme === option.value ? styles.themeOptionSelected : ""}`}
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={theme === option.value}
              onChange={() => setTheme(option.value)}
            />
            <span className={styles.themeOptionLabel}>{option.label}</span>
            <span className={styles.themeOptionDescription}>{option.description}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
