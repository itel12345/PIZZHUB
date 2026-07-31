// src/components/contact/components/ContactForm.tsx
//
// Section 3 — Frontend-only contact form. Unlike Checkout (where form
// state lives centrally in CheckoutPage because multiple sibling
// sections share it), this form is self-contained: it's the only
// interactive piece on the page, so its state and validation live
// here rather than being lifted to ContactPage for no benefit.
//
// No backend call exists yet — submitting just validates, shows a
// success state, and resets the form. Wiring this to a real endpoint
// later only touches the body of handleSubmit.

"use client";

import { useState } from "react";
import styles from "./ContactForm.module.css";

interface ContactFormValues {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const INITIAL_VALUES: ContactFormValues = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof ContactFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): ContactFormErrors => {
    const nextErrors: ContactFormErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Please enter your name.";
    }
    if (!values.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    }
    if (!values.message.trim()) {
      nextErrors.message = "Please enter a message.";
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstErrorField = Object.keys(nextErrors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    // TODO: send to a real endpoint once the backend exists.
    setSubmitted(true);
    setValues(INITIAL_VALUES);
    window.setTimeout(() => setSubmitted(false), 3200);
  };

  return (
    <section className={styles.section} aria-labelledby="contact-form-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Send a Message</span>
          <h2 id="contact-form-heading" className={styles.heading}>
            Tell Us What&apos;s on Your Mind
          </h2>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="fullName" className={styles.label}>
                Full Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                className={styles.input}
                value={values.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
              {errors.fullName && (
                <p id="fullName-error" className={styles.error} role="alert">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email Address <span aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={styles.input}
                value={values.email}
                onChange={(e) => updateField("email", e.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className={styles.error} role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="subject" className={styles.label}>
                Subject <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                className={styles.input}
                value={values.subject}
                onChange={(e) => updateField("subject", e.target.value)}
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="message" className={styles.label}>
                Message <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className={styles.textarea}
                value={values.message}
                onChange={(e) => updateField("message", e.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
              />
              {errors.message && (
                <p id="message-error" className={styles.error} role="alert">
                  {errors.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.submitButton} ${
              submitted ? styles.submitButtonActive : ""
            }`}
          >
            {submitted ? "Message Sent" : "Send Message"}
          </button>

          {submitted && (
            <p className={styles.successMessage} role="status">
              Thanks for reaching out — we&apos;ll get back to you shortly.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}