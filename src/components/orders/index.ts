// src/components/orders/index.ts
//
// Public barrel for the orders feature. Replaces the old
// storage/orderStorage.ts localStorage stub — orders are now real
// server records (src/lib/orders.ts), fetched via useOrder() (single)
// and useOrders() (list, for order history).

export { useOrder } from "./hooks/useOrder";
export { useOrders } from "./hooks/useOrders";
export type { Order } from "./hooks/useOrder";