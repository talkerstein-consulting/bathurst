import { useSyncExternalStore } from "react";

/**
 * The website the visitor last checked on /check.
 *
 * The field lives in the page's hero and the closing ask now lives in the footer's
 * envelope, which is a sibling of it rather than a child, so the two cannot share state
 * through props or a provider without wrapping the whole page in a client component for
 * one string. This is that one string: set when a check comes back, read by the ask so
 * its link to the booking form arrives pre-filled.
 *
 * It is deliberately not persisted. It is per-visit state, not a record of anyone.
 */
let site = "";
const listeners = new Set<() => void>();

export function setCheckedSite(url: string) {
  if (url === site) return;
  site = url;
  listeners.forEach((l) => l());
}

export function useCheckedSite() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);   // G13
    },
    () => site,
    () => "",                                   // the server has never checked anything
  );
}
