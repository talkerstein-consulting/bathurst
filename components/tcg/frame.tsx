"use client";

import type { ElementType, ReactNode } from "react";
import { TOK, useBox } from "./use-box";

/** A rounded rectangle path, inset from the box by `inset`. */
export function rrect(W: number, H: number, R: number, inset: number) {
  const r = Math.max(0, Math.min(R, H / 2, W / 2) - inset);
  const k = inset;
  const cx = W / 2;
  return `M${cx} ${k}H${W - k - r}A${r} ${r} 0 0 1 ${W - k} ${k + r}V${H - k - r}A${r} ${r} 0 0 1 ${W - k - r} ${H - k}H${k + r}A${r} ${r} 0 0 1 ${k} ${H - k - r}V${k + r}A${r} ${r} 0 0 1 ${k + r} ${k}Z`;
}

function Lines({
  w,
  h,
  r,
  single,
  hair,
}: {
  w: number;
  h: number;
  r: number;
  single?: boolean;
  hair?: boolean;
}) {
  if (!w || !h) return null;
  const { so, si, gap } = TOK;
  const R = Math.min(r, h / 2, w / 2);
  const box = (inset: number) => ({
    x: inset,
    y: inset,
    width: Math.max(0, w - 2 * inset),
    height: Math.max(0, h - 2 * inset),
    rx: Math.max(0, R - inset),
  });
  return (
    <svg className="lines" aria-hidden="true">
      <g filter="url(#grunge)">
        {!single && <rect className="o" {...box(so / 2)} />}
        <rect
          className="i"
          {...box(single ? (hair ? 1 : so) / 2 : so + gap + si / 2)}
        />
      </g>
    </svg>
  );
}

/**
 * A framed box. `single` draws one line instead of the double stroke; `hair`
 * makes that single line a hairline; `accent` flips the line to orange — only
 * ever used on something operable.
 *
 * A frame that holds an image must never set `overflow: hidden`: that clips the
 * outer stroke, which sits 1.5px outside the padding box.
 */
export function Frame({
  as: Tag = "div",
  single,
  hair,
  accent,
  className = "",
  children,
  ...rest
}: {
  as?: ElementType;
  single?: boolean;
  hair?: boolean;
  accent?: boolean;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const [ref, box] = useBox<HTMLDivElement>();
  const cls = [
    single ? "single" : "frame",
    hair && "hair",
    accent && "accent",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref} className={cls} {...rest}>
      <Lines
        w={single ? box.w : box.w + 2 * TOK.so}
        h={single ? box.h : box.h + 2 * TOK.so}
        r={box.r + (single ? 0 : TOK.so)}
        single={single}
        hair={hair}
      />
      {children}
    </Tag>
  );
}
