// src/components/orders/index.ts
//
// Public barrel for the orders feature. Exports everything from
// orderStorage.ts. No context/hooks layer yet — this phase is the
// storage layer only, not wired into CheckoutPage or Order Success.

export {
  getOrders,
  saveOrder,
  getLatestOrder,
  clearOrders,
} from "./storage/orderStorage";
export type { Order } from "./storage/orderStorage";