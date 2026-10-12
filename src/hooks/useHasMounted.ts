// src/hooks/useHasMounted.ts
//
// True only after the component has mounted on the client — false
// during SSR and during the client's own first (hydration) render,
// then flips to true. This is the React-blessed replacement for the
// classic pattern:
//
//   const [mounted, setMounted] = useState(false);
//   useEffect(() => setMounted(true), []);
//
// ...which newer eslint-plugin-react-hooks versions flag under
// react-hooks/set-state-in-effect. useSyncExternalStore is purpose-
// built for exactly this "does the client's reality differ from what
// the server rendered" synchronization, so it isn't a generic
// setState-in-effect at all — it's the dedicated tool for this.
//
// Needed anywhere a component must avoid a hydration mismatch — most
// commonly, anything using createPortal(..., document.body): document
// doesn't exist during SSR, and the client's FIRST render must still
// match the server's (null) output before switching over to the real
// content on the next render.

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}