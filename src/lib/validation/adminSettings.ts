// src/lib/validation/adminSettings.ts
//
// One file for every Settings-related mutation's shape validation —
// site config, the admin's own password change, and admin-role
// changes. These are three different concerns but all small and all
// exclusively used by the Settings feature, so splitting them into
// three near-empty files (matching lib/validation/adminCustomer.ts's
// fate — created, never actually needed) would scatter, not clarify.

import { z } from "zod";

const TIME_HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const siteSettingsUpdateSchema = z
  .object({
    storeName: z.string().trim().min(1, "Store name is required.").max(100),
    contactPhone: z.string().trim().max(30),
    contactEmail: z
      .string()
      .trim()
      .max(200)
      .refine((value) => value === "" || z.string().email().safeParse(value).success, {
        message: "Please enter a valid email.",
      }),
    address: z.string().trim().max(200),
    city: z.string().trim().max(100),
    region: z.string().trim().max(100),
    openingTime: z.string().regex(TIME_HH_MM, "Use 24-hour HH:MM, e.g. 09:00."),
    closingTime: z.string().regex(TIME_HH_MM, "Use 24-hour HH:MM, e.g. 22:00."),
    isStoreOpen: z.boolean(),

    deliveryFee: z
      .number()
      .min(0, "Delivery fee can't be negative.")
      .max(1000, "That delivery fee looks too high — double check it."),
    taxRate: z
      .number()
      .min(0, "Tax rate can't be negative.")
      .max(100, "Tax rate can't exceed 100%."),
    isDeliveryAvailable: z.boolean(),

    codEnabled: z.boolean(),
    mobileMoneyEnabled: z.boolean(),
    cardEnabled: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No settings were provided to update.",
  });

export type SiteSettingsUpdateInput = z.infer<typeof siteSettingsUpdateSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password."),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters.")
    .max(200, "That password is too long."),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const promoteAdminSchema = z.object({
  email: z.string().trim().email("Please enter a valid email.").max(200),
});

export type PromoteAdminInput = z.infer<typeof promoteAdminSchema>;

export const demoteAdminSchema = z.object({
  userId: z.string().trim().min(1, "A user id is required."),
});

export type DemoteAdminInput = z.infer<typeof demoteAdminSchema>;