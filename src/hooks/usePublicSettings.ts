// src/hooks/usePublicSettings.ts
//
// One fetch-on-mount hook shared by every customer-facing place that
// used to hardcode its own copy of the delivery fee / store name
// (NavbarLogo, CartSummary, OrderReview) — three independent constants
// that could silently disagree with each other, and with what checkout
// actually charges, is exactly the bug this replaces.
//
// Defaults match the SiteSettings schema's own defaults, not arbitrary
// placeholders — so the very first paint (before the fetch resolves)
// shows the same numbers a fresh, never-configured store would have
// server-side, rather than a blank or a $0 flash.
//
// Module-scope cache (cachedSettings / inFlightRequest below): Next.js
// client-side navigation does NOT reload the page or re-evaluate this
// module — it stays loaded in memory for the whole browser session.
// Without a cache, every single mount of Navbar/Cart/Checkout re-ran
// the fetch from scratch, which is exactly the "old value flashes
// before the new one appears" symptom on every navigation, not just
// the first. Caching here means only the FIRST mount across the whole
// session actually hits the network; every mount after that reads the
// already-known answer synchronously on first render — no flash.

import { useEffect, useState } from "react";
import type { PublicSiteSettingsDTO } from "@/lib/settings";

const DEFAULT_SETTINGS: PublicSiteSettingsDTO = {
  storeName: "PizzHub",
  deliveryFee: 15,
  taxRate: 0,
  isStoreOpen: true,
  codEnabled: true,
  mobileMoneyEnabled: true,
  cardEnabled: true,
};

let cachedSettings: PublicSiteSettingsDTO | null = null;
let inFlightRequest: Promise<PublicSiteSettingsDTO | null> | null = null;

function fetchPublicSettings(): Promise<PublicSiteSettingsDTO | null> {
  if (cachedSettings) return Promise.resolve(cachedSettings);

  // Also dedupes concurrent mounts (e.g. Navbar + CartSummary mounting
  // in the same tick) into a single network request instead of one per
  // component instance.
  if (!inFlightRequest) {
    inFlightRequest = fetch("/api/settings/public")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PublicSiteSettingsDTO | null) => {
        if (data) cachedSettings = data;
        return data;
      })
      .catch(() => null)
      .finally(() => {
        inFlightRequest = null;
      });
  }

  return inFlightRequest;
}

export function usePublicSettings(initial?: PublicSiteSettingsDTO): PublicSiteSettingsDTO {
  const [settings, setSettings] = useState<PublicSiteSettingsDTO>(() => {
    if (initial) {
      // Warms the shared cache too — any other consumer on this same
      // page (e.g. NavbarLogo, which has no server-fetched value of
      // its own) reads this synchronously as well, at zero extra cost.
      cachedSettings = initial;
      return initial;
    }
    return cachedSettings ?? DEFAULT_SETTINGS;
  });

  useEffect(() => {
    if (cachedSettings) return;

    let cancelled = false;

    fetchPublicSettings().then((data) => {
      if (!cancelled && data) {
        setSettings(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}