// src/components/about/components/TeamSection.tsx
//
// Section 7 — Team cards rendered from TEAM_MEMBERS. Photo placeholders
// are a styled initial-letter avatar (no external images/dependencies),
// per the brief's "do NOT use real people, use placeholders" instruction.

import { TEAM_MEMBERS } from "../data/aboutData";
import styles from "./TeamSection.module.css";

export default function TeamSection() {
  return (
    <section className={styles.section} aria-labelledby="team-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>The People Behind It</span>
          <h2 id="team-heading" className={styles.heading}>
            Meet the Team
          </h2>
        </div>

        <ul className={styles.grid}>
          {TEAM_MEMBERS.map((member) => (
            <li key={member.name} className={styles.card}>
              <div className={styles.avatar} aria-hidden="true">
                {member.name.charAt(0)}
              </div>
              <h3 className={styles.name}>{member.name}</h3>
              <span className={styles.role}>{member.role}</span>
              <p className={styles.bio}>{member.bio}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}