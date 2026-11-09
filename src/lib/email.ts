// src/lib/email.ts
//
// Server-only. Real transactional email through Resend's REST API
// (https://resend.com/docs/api-reference/emails/send-email), called with
// fetch, so no new dependency.
//
// There is NO fake or "log it to the console" delivery path. If the three
// settings below are missing, isEmailConfigured() is false and callers
// must say so honestly instead of claiming an email was sent.
//
//   RESEND_API_KEY  secret, server-side only (never NEXT_PUBLIC_)
//   EMAIL_FROM      e.g.  PizzHub <no-reply@mail.yourdomain.com>
//                   (the sending domain must be verified in Resend)
//   APP_URL         canonical site URL, e.g. https://pizzhub.example
//                   Links in emails are built from THIS, never from the
//                   request's Host header (host-header poisoning would
//                   otherwise let an attacker aim a victim's reset link
//                   at their own domain).

import "server-only";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email delivery is not configured.");
    this.name = "EmailNotConfiguredError";
  }
}

export class EmailSendError extends Error {
  constructor(public status: number | null) {
    super(`Email provider request failed${status ? ` (HTTP ${status})` : ""}.`);
    this.name = "EmailSendError";
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.EMAIL_FROM?.trim() &&
      process.env.APP_URL?.trim()
  );
}

function appUrl(): string {
  const raw = process.env.APP_URL?.trim();
  if (!raw) throw new EmailNotConfiguredError();
  return raw.replace(/\/+$/, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  if (!isEmailConfigured()) throw new EmailNotConfiguredError();

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM!.trim(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new EmailSendError(null);
  }

  if (!response.ok) throw new EmailSendError(response.status);
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const link = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to,
    subject: "Verify your PizzHub email address",
    text:
      `Hi ${name},\n\nPlease confirm your email address by opening this link ` +
      `(valid for 24 hours):\n${link}\n\nIf you didn't create a PizzHub account, ignore this email.`,
    html:
      `<p>Hi ${escapeHtml(name)},</p>` +
      `<p>Please confirm your email address (link valid for 24 hours):</p>` +
      `<p><a href="${escapeHtml(link)}">Verify my email</a></p>` +
      `<p>If you didn't create a PizzHub account, you can ignore this email.</p>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to,
    subject: "Reset your PizzHub password",
    text:
      `Hi ${name},\n\nUse this link to choose a new password (valid for 1 hour):\n${link}\n\n` +
      `If you didn't ask for this, ignore this email; your password is unchanged.`,
    html:
      `<p>Hi ${escapeHtml(name)},</p>` +
      `<p>Use this link to choose a new password (valid for 1 hour):</p>` +
      `<p><a href="${escapeHtml(link)}">Reset my password</a></p>` +
      `<p>If you didn't ask for this, ignore this email; your password is unchanged.</p>`,
  });
}
