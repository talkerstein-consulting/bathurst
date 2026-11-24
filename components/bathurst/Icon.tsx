import { cn } from "@/lib/utils";

/** Line icon drawn from trusted, hard-coded path data in lib/bathurst/data.ts. */
export function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-5 shrink-0 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]", className)}
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}

export const ARROW_RIGHT = '<path d="M5 12h14M13 6l6 6-6 6"/>';
export const PIN = '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/>';
