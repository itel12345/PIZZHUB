// src/components/profile/hooks/useAccountPanel.ts
//
// Controls the mobile drawer's second sliding panel (Navigation ->
// Account, iOS-Settings-style). Deliberately a tiny, isolated hook —
// same reasoning as useAuthModal: only one consumer (MobileNavLinks)
// needs this today, so a Context would be premature. Kept in the
// profile feature (not inside layout/NavActions) since the account
// panel's content IS profile/account content — the hook travels with
// the feature it belongs to, not with wherever it's first consumed.

"use client";

import { useCallback, useState } from "react";

export function useAccountPanel() {
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);

  const openAccountPanel = useCallback(() => {
    setIsAccountPanelOpen(true);
  }, []);

  const closeAccountPanel = useCallback(() => {
    setIsAccountPanelOpen(false);
  }, []);

  return {
    isAccountPanelOpen,
    openAccountPanel,
    closeAccountPanel,
    setIsAccountPanelOpen,
  };
}