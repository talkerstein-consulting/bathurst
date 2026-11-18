import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * STYLE.md CTAs. Outline only: the line system (LineSystem.tsx) draws the inner line and sprouts the outer one.
 * The visible label is two stacked copies for the tumble, so it is aria-hidden and the element carries aria-label.
 *   variant "btn"  primary rounded rectangle · "icon" square icon-only
 *   accent         Muted Orange (one accent CTA per section)
 *
 * There is no underlined variant. Every call to action on the site is the outlined button — a secondary one is the
 * same button at the small size, not an underlined label — so the two read as one family and the only thing that
 * ranks them is size and the accent. `.link` in app/globals.css is kept for prose links, not for actions.
 */
type Common = { label: string; children?: ReactNode; variant?: "btn" | "icon"; accent?: boolean; small?: boolean; className?: string };

const cls = ({ variant = "btn", accent, small, className }: Common) =>
  cn("sprout", "btn", variant === "icon" && "icon", small && "sm", accent && "orange", className);

function Label({ label, children }: { label: string; children?: ReactNode }) {
  const inner = children ?? label;
  return (
    <span className="label" aria-hidden="true">
      <span>{inner}</span>
      <span>{inner}</span>
    </span>
  );
}

export function CtaLink({ label, children, variant, accent, small, className, ...rest }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...rest} aria-label={label} className={cls({ label, variant, accent, small, className })}>
      <Label label={label}>{children}</Label>
    </a>
  );
}

export function CtaButton({ label, children, variant, accent, small, className, type = "button", ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} type={type} aria-label={label} className={cls({ label, variant, accent, small, className })}>
      <Label label={label}>{children}</Label>
    </button>
  );
}
