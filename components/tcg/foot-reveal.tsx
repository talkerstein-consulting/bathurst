"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * The footer's reveal, from React Bits Pro `footer-13`: each band fades and
 * rises once as it comes into view, and never again.
 *
 * D11 — one motion style for the whole footer, so nothing here slides while
 * something else fades. The curve is the page's own --ease-out
 * (cubic-bezier(.22, 1, .36, 1)) written out, because a CSS custom property
 * cannot be handed to a JS animation.
 *
 * prefers-reduced-motion drops the travel and keeps the fade, which is the
 * same fallback the lockup takes next to it.
 */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function FootReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
