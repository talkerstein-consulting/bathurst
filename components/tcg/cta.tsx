"use client";

import { Info } from "lucide-react";
import {
  useEffect,
  useState,
  type CSSProperties,
  type ElementType,
  type MouseEvent,
  type ReactNode,
} from "react";
import { makeSeeds, type Seed } from "./sprout";
import { TOK, useBox } from "./use-box";


export type CtaProps = {
  as?: ElementType;
  variant?: "btn" | "icon";
  primary?: boolean;
  small?: boolean;
  block?: boolean;
  /** Draws a sprouting underline instead of the sprouting outline. */
  underline?: boolean;
  disabled?: boolean;
  reason?: string;
  label: string;
  children?: ReactNode;
  twin?: ReactNode;
  onActivate?: (e: MouseEvent) => void;
  className?: string;
} & Record<string, unknown>;

/**
 * Every CTA in the system. Outline only — no fill, no underline. The label sits
 * --cta-pad from the line on all four sides. At rest: a hairline. On hover,
 * focus or press the heavy outer line sprouts from several points and closes,
 * and the label tumbles to its twin.
 *
 * Disabled uses aria-disabled rather than the native attribute, so a press can
 * still be detected and answered with a reason (D04).
 */
export function Cta({
  as,
  variant = "btn",
  primary,
  small,
  block,
  underline,
  disabled,
  reason,
  label,
  children,
  twin,
  onActivate,
  className = "",
  ...rest
}: CtaProps) {
  const Tag: ElementType = as || (rest.href ? "a" : "button");
  const [ref, box] = useBox<HTMLElement>();
  const [on, setOn] = useState(false);
  const [said, setSaid] = useState(false);

  /**
   * The seeds are random, so they are generated in an effect rather than during
   * render: a value computed in render is evaluated at prerender time and baked
   * into the static HTML, which both freezes the randomness and trips Next's
   * unstable-value check. Deferring it also means the geometry is only ever
   * built from a real measurement, never from the zero-size first pass.
   */
  const [geom, setGeom] = useState<{
    inner: string;
    outer: string;
    seeds: Seed[];
  }>({ inner: "", outer: "", seeds: [] });

  useEffect(() => {
    if (!box.w || !box.h) return;
    setGeom(
      makeSeeds(
        box.w + 2 * TOK.so,
        box.h + 2 * TOK.so,
        box.r + TOK.so,
        underline,
      ),
    );
  }, [box.w, box.h, box.r, underline]);

  const cls = [
    "sprout",
    "btn",
    variant === "icon" && "icon",
    small && "sm",
    block && "block",
    underline && "underlined",
    primary && "primary",
    disabled && "is-off",
    on && "on",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const press = (e: MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      setSaid(true);
      return;
    }
    onActivate?.(e);
  };

  const inner = children ?? label;

  return (
    <>
      <Tag
        ref={ref}
        className={cls}
        aria-label={label}
        aria-disabled={disabled ? "true" : undefined}
        type={Tag === "button" ? "button" : undefined}
        onPointerEnter={() => setOn(true)}
        onPointerLeave={() => setOn(false)}
        onFocus={() => setOn(true)}
        onBlur={() => setOn(false)}
        onClick={press}
        {...rest}
      >
        <svg className="stroke" aria-hidden="true">
          <g filter="url(#grunge)">
            <path className="inner" d={geom.inner} />
            {geom.seeds.map((s, i) => (
              <path
                key={i}
                className="outer"
                pathLength="1"
                d={geom.outer}
                style={
                  {
                    "--seed": s.seed,
                    "--from": s.from,
                    "--len": s.len,
                    "--rest": s.rest,
                    "--delay": `${s.delay}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </g>
        </svg>
        <span className="label" aria-hidden="true">
          <span>{inner}</span>
          <span>{twin ?? inner}</span>
        </span>
      </Tag>
      {disabled && said && reason && (
        <p className="why" role="status">
          <Info className="glyph sm" aria-hidden="true" />
          {reason}
        </p>
      )}
    </>
  );
}
