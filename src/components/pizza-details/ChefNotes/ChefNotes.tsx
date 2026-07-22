// src/components/pizza-details/ChefNotes/ChefNotes.tsx
//
// Reusable editorial "chef's note" block. Takes an optional `note` prop so
// it can later be fed real per-pizza copy from the database — for now it
// falls back to placeholder text, per the spec.

import styles from "./ChefNotes.module.css";

interface ChefNotesProps {
  note?: string;
}

const DEFAULT_NOTE =
  "Crafted using our 48-hour fermented dough and baked in a traditional wood-fired oven for exceptional flavour and texture.";

export default function ChefNotes({ note = DEFAULT_NOTE }: ChefNotesProps) {
  return (
    <section className={styles.section} aria-labelledby="chef-notes-heading">
      <h2 id="chef-notes-heading" className={styles.heading}>
        Chef&apos;s Notes
      </h2>
      <blockquote className={styles.quote}>
        <p>{note}</p>
      </blockquote>
    </section>
  );
}