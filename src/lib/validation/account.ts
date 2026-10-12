// src/lib/validation/account.ts
//
// Shape validation for Profile → Settings' own mutations. Same field
// rules as lib/validation/adminSettings.ts's changePasswordSchema
// (there's only one reasonable password-strength policy in this app),
// but defined fresh here rather than imported from there: that file
// belongs to the Admin Settings feature and can change for reasons
// that have nothing to do with a customer's own account (e.g. an
// admin-only field being added to it later). Keeping this schema
// local to the customer Account feature means the two can't
// accidentally couple to each other.

import { z } from "zod";

export const changeUserPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password."),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters.")
    .max(200, "That password is too long."),
});

export type ChangeUserPasswordInput = z.infer<typeof changeUserPasswordSchema>;

export const marketingPreferencesSchema = z
  .object({
    emailMarketingOptIn: z.boolean(),
    smsMarketingOptIn: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No preferences were provided to update.",
  });

export type MarketingPreferencesInput = z.infer<typeof marketingPreferencesSchema>;

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password."),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
