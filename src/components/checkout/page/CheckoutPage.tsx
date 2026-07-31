// src/components/checkout/page/CheckoutPage.tsx
//
// Owns all checkout form state in a single object + a matching errors
// object. Each section component below is a pure "values in, onChange
// out" component — no section owns its own state or validation logic,
// all of that lives here so validation stays centralized and consistent.
//
// Order data (items, subtotal) is read directly from useCart() via
// OrderReview — this page never duplicates cart logic.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart";
import { saveOrder, type Order } from "@/components/orders";
import CustomerInformation, {
  type CustomerInformationValues,
} from "../components/CustomerInformation";
import DeliveryAddress, {
  type DeliveryAddressValues,
} from "../components/DeliveryAddress";
import DeliveryMethod, {
  type DeliveryMethodValue,
} from "../components/DeliveryMethod";
import PaymentMethod, {
  type PaymentMethodValue,
} from "../components/PaymentMethod";
import OrderReview from "../components/OrderReview";
import styles from "./CheckoutPage.module.css";

interface CheckoutFormData
  extends CustomerInformationValues,
    DeliveryAddressValues {
  deliveryMethod: DeliveryMethodValue | null;
  paymentMethod: PaymentMethodValue | null;
}

type CheckoutFormErrors = Partial<
  Record<
    | keyof CustomerInformationValues
    | keyof DeliveryAddressValues
    | "deliveryMethod"
    | "paymentMethod",
    string
  >
>;

const INITIAL_FORM_DATA: CheckoutFormData = {
  fullName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  region: "",
  postalCode: "",
  deliveryInstructions: "",
  deliveryMethod: null,
  paymentMethod: null,
};

// Matches OrderReview's local constants — duplicated intentionally
// rather than touching other files for this phase. Flagged as a future
// candidate to extract into one shared constant.
const DELIVERY_FEE = 15;
const TAX = 0;

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const hasRedirected = useRef(false);

  // Guard against checking out an empty cart. Runs after mount so it
  // doesn't fire during the cart's own hydration-from-storage effect.
  useEffect(() => {
    if (items.length === 0 && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/cart");
    }
  }, [items, router]);

  const updateField = <K extends keyof CheckoutFormData>(
    field: K,
    value: CheckoutFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error the moment the person starts fixing it.
    setErrors((prev) => {
      if (!prev[field as keyof CheckoutFormErrors]) return prev;
      const next = { ...prev };
      delete next[field as keyof CheckoutFormErrors];
      return next;
    });
  };

  const validate = (): CheckoutFormErrors => {
    const nextErrors: CheckoutFormErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Please enter your full name.";
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = "Please enter a phone number.";
    }
    if (!formData.street.trim()) {
      nextErrors.street = "Please enter your street address.";
    }
    if (!formData.city.trim()) {
      nextErrors.city = "Please enter your city.";
    }
    if (!formData.region.trim()) {
      nextErrors.region = "Please enter your region or state.";
    }
    if (!formData.deliveryMethod) {
      nextErrors.deliveryMethod = "Please choose a delivery method.";
    }
    if (!formData.paymentMethod) {
      nextErrors.paymentMethod = "Please choose a payment method.";
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      // Focus the first invalid field for keyboard/screen-reader users.
      const firstErrorField = Object.keys(nextErrors)[0];
      const el = document.getElementById(firstErrorField);
      el?.focus();
      return;
    }

    // Validation passed — build the completed Order record. deliveryMethod
    // and paymentMethod are guaranteed non-null here since validate()
    // already confirmed both are set (that's exactly what those two
    // error checks above exist to enforce).
    const order: Order = {
      id: crypto.randomUUID(),
      placedAt: new Date().toISOString(),
      customer: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      },
      address: {
        street: formData.street,
        city: formData.city,
        region: formData.region,
        postalCode: formData.postalCode,
        deliveryInstructions: formData.deliveryInstructions,
      },
      deliveryMethod: formData.deliveryMethod as DeliveryMethodValue,
      paymentMethod: formData.paymentMethod as PaymentMethodValue,
      items,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      tax: TAX,
      total: subtotal + DELIVERY_FEE + TAX,
    };

    saveOrder(order);
    // Mark as "already redirecting" BEFORE clearing the cart — clearCart()
    // empties items, which would otherwise trigger the effect above
    // (redirect to /cart on empty cart) in the same tick as the
    // order-success navigation below, racing against it.
    hasRedirected.current = true;
    clearCart();
    router.push("/order-success");
  };

  if (items.length === 0) {
    // Redirect is in flight (see effect above) — render nothing.
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Checkout</h1>

        <form className={styles.layout} onSubmit={handleSubmit} noValidate>
          <div className={styles.formColumn}>
            <CustomerInformation
              values={{
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
              }}
              errors={{ fullName: errors.fullName, phone: errors.phone }}
              onChange={(field, value) => updateField(field, value)}
            />

            <DeliveryAddress
              values={{
                street: formData.street,
                city: formData.city,
                region: formData.region,
                postalCode: formData.postalCode,
                deliveryInstructions: formData.deliveryInstructions,
              }}
              errors={{
                street: errors.street,
                city: errors.city,
                region: errors.region,
              }}
              onChange={(field, value) => updateField(field, value)}
            />

            <DeliveryMethod
              value={formData.deliveryMethod}
              error={errors.deliveryMethod}
              onChange={(value) => updateField("deliveryMethod", value)}
            />

            <PaymentMethod
              value={formData.paymentMethod}
              error={errors.paymentMethod}
              onChange={(value) => updateField("paymentMethod", value)}
            />
          </div>

          <div className={styles.reviewColumn}>
            <OrderReview />
            <button type="submit" className={styles.placeOrderButton}>
              Place Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}