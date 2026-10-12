// src/lib/addresses.ts
//
// Same ownership-check discipline as findOwnedOrder/findOwnedCartItem
// elsewhere in this app: an address id alone is never sufficient,
// every read/write re-confirms userId matches. "At most one default
// per user" is enforced here, at the application layer, inside a
// transaction — the same approach already used for the SiteSettings
// singleton, rather than a database constraint for one boolean flag.

import "server-only";
import { prisma } from "./prisma";
import type { AddressInput, AddressUpdateInput } from "./validation/address";

export interface AddressDTO {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  deliveryInstructions: string;
  isDefault: boolean;
  updatedAt: string;
}

interface AddressRow {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  deliveryInstructions: string;
  isDefault: boolean;
  updatedAt: Date;
}

function toAddressDTO(address: AddressRow): AddressDTO {
  return {
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    street: address.street,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    deliveryInstructions: address.deliveryInstructions,
    isDefault: address.isDefault,
    updatedAt: address.updatedAt.toISOString(),
  };
}

export class AddressNotFoundError extends Error {}

export async function listAddressesForUser(userId: string): Promise<AddressDTO[]> {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return addresses.map(toAddressDTO);
}

/**
 * A brand-new address becomes the default automatically if it's the
 * user's first one (there's always a default once any address exists)
 * or if the caller explicitly asked for it — either way, any previous
 * default is unset first, inside the same transaction, so there is
 * never a moment with two defaults.
 */
export async function createAddressForUser(
  userId: string,
  input: AddressInput
): Promise<AddressDTO> {
  const existingCount = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = input.isDefault === true || existingCount === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId,
        label: input.label,
        fullName: input.fullName,
        phone: input.phone,
        street: input.street,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode ?? "",
        deliveryInstructions: input.deliveryInstructions ?? "",
        isDefault: shouldBeDefault,
      },
    });
  });

  return toAddressDTO(address);
}

export async function updateAddressForUser(
  userId: string,
  addressId: string,
  input: AddressUpdateInput
): Promise<AddressDTO> {
  const existing = await prisma.address.findUnique({ where: { id: addressId } });

  if (!existing || existing.userId !== userId) {
    throw new AddressNotFoundError("Address not found.");
  }

  const willBecomeDefault = input.isDefault === true;

  const updated = await prisma.$transaction(async (tx) => {
    if (willBecomeDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id: addressId },
      data: {
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.street !== undefined ? { street: input.street } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.region !== undefined ? { region: input.region } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.deliveryInstructions !== undefined
          ? { deliveryInstructions: input.deliveryInstructions }
          : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      },
    });
  });

  return toAddressDTO(updated);
}

/**
 * If the deleted address was the default, the most recently created
 * remaining address is promoted automatically — so a user who has any
 * saved addresses always has exactly one default, never zero, without
 * having to manually pick a new one right after a delete.
 */
export async function deleteAddressForUser(userId: string, addressId: string): Promise<void> {
  const existing = await prisma.address.findUnique({ where: { id: addressId } });

  if (!existing || existing.userId !== userId) {
    throw new AddressNotFoundError("Address not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const nextDefault = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (nextDefault) {
        await tx.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }
  });
}