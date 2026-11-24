"use client";

import { useSyncExternalStore } from "react";

/**
 * The cover sheet (reviews, services, footer) waits just under the fold inside the sticky map, moved by a transform rather
 * than by scrolling, so native lazy-loading would fetch its images with the first page load. Its sections hold their images
 * back until the engine signals the visitor is heading there (`tcg:cover-near`, sent once the route directions are close).
 */
const subscribe = (cb: () => void) => { addEventListener("tcg:cover-near", cb); return () => removeEventListener("tcg:cover-near", cb); };
const near = () => !!(window as Window & { __tcgCoverNear?: boolean }).__tcgCoverNear;

export const useCoverNear = () => useSyncExternalStore(subscribe, near, () => false);
