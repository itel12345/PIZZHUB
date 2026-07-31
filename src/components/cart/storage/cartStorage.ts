/**
 * cartStorage.ts
 *
 * The ONLY file in the cart feature allowed to touch localStorage directly.
 * Every other file (context, hooks, UI) talks to the cart through
 * CartContext / useCart — never through this module directly.
 *
 * This isolation is deliberate: when the project moves to PostgreSQL + Prisma,
 * this file is the only one that needs to be rewritten (swap load/save for
 * fetch/mutate calls). Nothing else in the app needs to change.
 *
 * All functions fail gracefully — they never throw. A corrupt, missing, or
 * malformed value in localStorage is treated the same as an empty cart,
 * rather than crashing the app.
 */

export interface CartItem {
  pizzaId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

const STORAGE_KEY = "pizzhub:cart";

/**
 * Computes the identity key used to decide whether two cart entries are
 * "the same line" (and should therefore be merged by increasing quantity
 * rather than added as a duplicate row).
 *
 * Today this is just the pizzaId. When size/toppings/notes are introduced,
 * this is the ONLY function that needs to change — e.g.
 *   `${item.pizzaId}::${item.size}::${item.toppings.slice().sort().join(",")}`
 * CartContext, hooks, and all UI components will continue to work unmodified
 * because they only ever call this helper, never compare fields directly.
 */
export function getCartItemKey(item: Pick<CartItem, "pizzaId">): string {
  return item.pizzaId;
}

/**
 * Type guard that validates a single unknown value looks like a CartItem.
 * Guards against manually-edited or stale/old-shape localStorage data.
 */
function isValidCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.pizzaId === "string" &&
    candidate.pizzaId.length > 0 &&
    typeof candidate.name === "string" &&
    typeof candidate.image === "string" &&
    typeof candidate.price === "number" &&
    Number.isFinite(candidate.price) &&
    candidate.price >= 0 &&
    typeof candidate.quantity === "number" &&
    Number.isFinite(candidate.quantity) &&
    candidate.quantity >= 1
  );
}

/**
 * Loads the cart from localStorage.
 * Returns an empty array if localStorage is unavailable (SSR), the key is
 * missing, the JSON is malformed, or the shape doesn't validate.
 */
export function load(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidCartItem);
  } catch {
    // Corrupt JSON, disabled storage, or any other unexpected failure —
    // treat it as an empty cart rather than throwing.
    return [];
  }
}

/**
 * Persists the given cart items to localStorage.
 * Silently no-ops on failure (e.g. storage disabled, quota exceeded,
 * private browsing restrictions) — never throws.
 */
export function save(items: CartItem[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Intentionally swallowed — persistence is best-effort only.
  }
}

/**
 * Clears the cart from localStorage entirely.
 */
export function clear(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Intentionally swallowed.
  }
}