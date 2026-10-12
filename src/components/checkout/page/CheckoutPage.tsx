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
import { getStoredAuthToken } from "@/components/auth";
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
import type { PublicSiteSettingsDTO } from "@/lib/settings";
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

// DELIVERY_FEE/TAX previously lived here as local constants used to
// build the order total client-side. That computation now happens
// exclusively server-side (src/lib/orders.ts, DELIVERY_FEE/TAX
// exported from there) — the client never computes or sends a total,
// so duplicating those constants here would just be dead code.

export function CheckoutPage({
  initialSettings,
}: {
  /** Server-fetched settings, threaded down from
   * app/checkout/page.tsx — see OrderReview for why. */
  initialSettings?: PublicSiteSettingsDTO;
}) {
  const { items, clearCart } = useCart();
  const router = useRouter();

  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // React state updates (setIsSubmitting) aren't synchronous — the
    // `disabled` attribute on the button won't actually reflect true
    // until the next render. A fast double-click or double-Enter can
    // fire this handler twice before that render happens, which would
    // create two orders from one submission. This ref is checked and
    // set in the same tick, before any of that render-timing gap can
    // matter — it's the actual guard; disabling the button is the
    // visible/UX layer on top of it, not the mechanism itself.
    if (isSubmittingRef.current) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      // Focus the first invalid field for keyboard/screen-reader users.
      const firstErrorField = Object.keys(nextErrors)[0];
      const el = document.getElementById(firstErrorField);
      el?.focus();
      return;
    }

    // Client validation passed — the server independently re-validates
    // everything AND recomputes subtotal/total from the live cart
    // itself (never from anything this request body claims). This
    // request carries the customer/address/method fields the form
    // collected; it does not carry items, subtotal, or total — those
    // don't exist as client-supplied inputs to this endpoint at all.
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
      const token = getStoredAuthToken();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          region: formData.region,
          postalCode: formData.postalCode,
          deliveryInstructions: formData.deliveryInstructions,
          deliveryMethod: formData.deliveryMethod,
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fieldErrors) {
          setErrors((prev) => ({ ...prev, ...data.fieldErrors }));
        }
        setSubmitError(data.error || "Something went wrong. Please try again.");
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }

      if (data.authorizationUrl) {
        // Online payment (MoMo/card via Paystack): leaving the app
        // entirely for Paystack's hosted payment page, so this is a
        // full browser navigation, not router.push. Deliberately does
        // NOT call clearCart() here — the cart stays exactly as-is
        // until a verified webhook confirms payment (see
        // confirmOnlinePayment in lib/orders.ts); if the person
        // abandons the Paystack page, their cart must still be intact
        // when they come back. isSubmitting is deliberately left true
        // rather than reset — the page is navigating away regardless,
        // and flipping the button back to "Place Order" for the brief
        // moment before that happens would be a visible flicker with
        // no purpose.
        window.location.href = data.authorizationUrl;
        return;
      }

      // Mark as "already redirecting" BEFORE clearing the cart —
      // clearCart() empties items, which would otherwise trigger the
      // effect above (redirect to /cart on empty cart) in the same
      // tick as the order-success navigation below, racing against it.
      hasRedirected.current = true;

      // The server already cleared the cart as part of confirming the
      // order (see createCodOrder) — this call updates the CLIENT's
      // in-memory cart state to match (CartContext has no way to know
      // the server-side deletion happened otherwise), and is a
      // harmless no-op deletion on the server's side since there's
      // nothing left to clear by the time it runs.
      clearCart();

      router.push(`/order-success?orderId=${data.id}`);
    } catch {
      setSubmitError("Something went wrong. Please check your connection and try again.");
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
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
            <OrderReview initialSettings={initialSettings} />
            {submitError && (
              <p className={styles.submitError} role="alert">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              className={styles.placeOrderButton}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              <span
                className={`${styles.buttonLabel} ${
                  isSubmitting ? styles.buttonLabelHidden : ""
                }`}
              >
                Place Order
              </span>
              {isSubmitting && (
                <span className={styles.buttonLoading}>
                  <svg
                    className={styles.spinner}
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className={styles.spinnerTrack}
                      cx="12"
                      cy="12"
                      r="9.5"
                      strokeWidth="2.5"
                    />
                    <path
                      className={styles.spinnerHead}
                      d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Placing Order…
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}