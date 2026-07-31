// src/components/contact/page/ContactPage.tsx
//
// Composes all Contact page sections in order, mirroring AboutPage.tsx.

import ContactHero from "../components/ContactHero";
import ContactCards from "../components/ContactCards";
import ContactForm from "../components/ContactForm";
import FAQSection from "../components/FAQSection";
import ContactCTA from "../components/ContactCTA";
import styles from "./ContactPage.module.css";

export function ContactPage() {
  return (
    <div className={styles.page}>
      <ContactHero />
      <ContactCards />
      <ContactForm />
      <FAQSection />
      <ContactCTA />
    </div>
  );
}