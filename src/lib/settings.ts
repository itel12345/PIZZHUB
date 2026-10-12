// src/lib/settings.ts
//
// Single source of truth for store/order/payment configuration — the
// one place any part of the app reads "what's the delivery fee right
// now" or "is Cash on Delivery enabled". Nothing outside this file
// should ever read process.env or a hardcoded constant for these
// values again; lib/orders.ts and app/api/checkout/route.ts both call
// into here rather than each keeping their own copy.

import "server-only";
import { prisma } from "./prisma";
import type { SiteSettingsUpdateInput } from "./validation/adminSettings";

const SETTINGS_ID = "singleton";

export interface SiteSettingsDTO {
  storeName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  region: string;
  openingTime: string;
  closingTime: string;
  isStoreOpen: boolean;

  deliveryFee: number;
  taxRate: number;
  isDeliveryAvailable: boolean;

  codEnabled: boolean;
  mobileMoneyEnabled: boolean;
  cardEnabled: boolean;

  updatedAt: string;
}

interface SiteSettingsRow {
  storeName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  region: string;
  openingTime: string;
  closingTime: string;
  isStoreOpen: boolean;
  deliveryFee: number;
  taxRate: number;
  isDeliveryAvailable: boolean;
  codEnabled: boolean;
  mobileMoneyEnabled: boolean;
  cardEnabled: boolean;
  updatedAt: Date;
}

function toDTO(row: SiteSettingsRow): SiteSettingsDTO {
  return {
    storeName: row.storeName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    address: row.address,
    city: row.city,
    region: row.region,
    openingTime: row.openingTime,
    closingTime: row.closingTime,
    isStoreOpen: row.isStoreOpen,
    deliveryFee: row.deliveryFee,
    taxRate: row.taxRate,
    isDeliveryAvailable: row.isDeliveryAvailable,
    codEnabled: row.codEnabled,
    mobileMoneyEnabled: row.mobileMoneyEnabled,
    cardEnabled: row.cardEnabled,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Self-healing singleton: the first call anywhere in the app's
 * lifetime creates the one settings row (with schema defaults) if it
 * doesn't exist yet — no separate seed script or manual migration data
 * step required. Every subsequent read/write targets the same fixed
 * id, so there is, by construction, never more than one row.
 */
export async function getSiteSettings(): Promise<SiteSettingsDTO> {
  const row = await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
  return toDTO(row);
}

export class InvalidSettingsError extends Error {}

export async function updateSiteSettings(
  input: SiteSettingsUpdateInput
): Promise<SiteSettingsDTO> {
  const current = await getSiteSettings();

  const nextCod = input.codEnabled ?? current.codEnabled;
  const nextMomo = input.mobileMoneyEnabled ?? current.mobileMoneyEnabled;
  const nextCard = input.cardEnabled ?? current.cardEnabled;

  // Checked against the MERGED result (current + incoming), not the
  // incoming payload alone — a request that only touches storeName
  // must not accidentally trip this if all three happen to already be
  // off (they can't be, since this same check ran on the update that
  // got them there, but never assume a future code path can't reach
  // this table another way).
  if (!nextCod && !nextMomo && !nextCard) {
    throw new InvalidSettingsError(
      "At least one payment method must stay enabled — customers need a way to pay."
    );
  }

  const row = await prisma.siteSettings.update({
    where: { id: SETTINGS_ID },
    data: input,
  });

  return toDTO(row);
}

/** Percentage points (0–100) applied to a subtotal, rounded the same
 * way every other money sum in this app is (see lib/customers.ts) to
 * guard against floating-point remainders like 12.780000000000001. */
export function computeTax(subtotal: number, taxRatePercent: number): number {
  return Math.round(subtotal * (taxRatePercent / 100) * 100) / 100;
}

/** Maps enabled payment-method toggles to the Paystack `channels`
 * array — the actual server-side enforcement point for Card/Mobile
 * Money, not a UI-only restriction. Empty array means "nothing is
 * enabled online right now"; the caller (createOnlinePendingOrder) is
 * responsible for rejecting the request outright in that case rather
 * than calling Paystack with no channels at all. */
export function getEnabledPaystackChannels(settings: SiteSettingsDTO): string[] {
  const channels: string[] = [];
  if (settings.cardEnabled) channels.push("card");
  if (settings.mobileMoneyEnabled) channels.push("mobile_money");
  return channels;
}

export interface PublicSiteSettingsDTO {
  storeName: string;
  deliveryFee: number;
  taxRate: number;
  isStoreOpen: boolean;
  codEnabled: boolean;
  mobileMoneyEnabled: boolean;
  cardEnabled: boolean;
}

/**
 * The deliberately narrow, public-safe slice of SiteSettings —
 * everything the storefront (Navbar branding, Cart/Checkout price
 * previews, the Profile > Payment Methods page) needs to stop
 * drifting from what checkout actually enforces, and nothing more. No
 * contact info, address, or hours here: those aren't secrets, but
 * they're also not needed by anything unauthenticated reads this DTO
 * for. The three payment toggles ARE included — they're not secrets
 * either, and they already gate real behavior at checkout (see
 * lib/orders.ts's PaymentMethodDisabledError) — a customer seeing
 * "Card unavailable right now" here is just being told the truth
 * about something that already applies to them.
 */
export async function getPublicSiteSettings(): Promise<PublicSiteSettingsDTO> {
  const settings = await getSiteSettings();
  return {
    storeName: settings.storeName,
    deliveryFee: settings.deliveryFee,
    taxRate: settings.taxRate,
    isStoreOpen: settings.isStoreOpen,
    codEnabled: settings.codEnabled,
    mobileMoneyEnabled: settings.mobileMoneyEnabled,
    cardEnabled: settings.cardEnabled,
  };
}

export interface SystemStatusDTO {
  database: "connected" | "error";
  paystackConfigured: boolean;
  cloudinaryConfigured: boolean;
}

/** Never returns a secret value — only whether one is present. A
 * failed DB check is caught, not thrown, since "the database is down"
 * is exactly the kind of thing this panel exists to surface, not
 * something that should crash the Settings page itself. */
export async function getSystemStatus(): Promise<SystemStatusDTO> {
  let database: "connected" | "error" = "connected";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  return {
    database,
    paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY?.trim()),
    cloudinaryConfigured: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
        process.env.CLOUDINARY_API_KEY?.trim() &&
        process.env.CLOUDINARY_API_SECRET?.trim()
    ),
  };
}