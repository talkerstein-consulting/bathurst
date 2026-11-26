"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Cta } from "./cta";
import { NAV } from "./nav-data";

/**
 * The sticky masthead, after Monocle: once the full masthead has scrolled past,
 * a bar slides down and stays. It keeps two rows.
 *
 *  · The top row carries the controls — the roundel, the menu and the search on
 *    the left, the wordmark centred, the account controls on the right.
 *  · The second row keeps the section titles visible, exactly as the page bar
 *    shows them, so Work and Services stay reachable while reading rather than
 *    being folded away behind the menu.
 *
 * The menu opens a megamenu: a full-width panel of columns, one per section,
 * not a stack of the same six links. All three navigations read from
 * ./nav-data, so they cannot drift apart.
 *
 * It watches the masthead block with an observer rather than reading a scroll
 * offset: the observer fires once per crossing, where a scroll handler fires on
 * every frame and has to be told the masthead's height. It watches the block
 * and not a zero-height marker at the foot of it, because a target with no area
 * is not reliably reported as intersecting.
 *
 * The roundel and the wordmark are inert — the paper's name, not controls.
 *
 * `always` shows the bar from the first paint at every width. The campaign landing page
 * (app/check/page.tsx) passes it, because that page has no full masthead for the bar to
 * replace — the bar IS its header, as it already is on a phone.
 */
export function TopBar({ always = false }: { always?: boolean }) {
  const [stuck, setStuck] = useState(false);
  /* On phones this bar is not a scrolled state at all: it IS the header, in
     every instance, and the full masthead below is hidden (globals.css). So it
     shows from the first paint rather than waiting for the masthead to pass,
     and it must not be inert -- the burger behind it is the only navigation on
     the page. Tracked in JS rather than CSS because `inert` and `aria-hidden`
     are attributes, not styles, and CSS cannot reach them. */
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* The bar is shown when it is the header (phones) or once the masthead has
     gone (wider screens). Everything below keys off this, not off `stuck`. */
  const shown = stuck || compact || always;

  useEffect(() => {
    const mark = document.getElementById("mast-block");
    if (!mark) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const condensed = !e.isIntersecting && e.boundingClientRect.bottom <= 0;
        setStuck(condensed);
        // Nothing may stay open behind a bar that has gone back off screen.
        if (!condensed) setOpen(false);
      },
      { threshold: 0 },
    );
    io.observe(mark);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
    };
    const away = (e: PointerEvent) => {
      if (bar.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", away);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", away);
    };
  }, [open]);

  return (
    <header
      className="topbar"
      ref={bar}
      data-stuck={shown ? "true" : "false"}
      // Out of the tab order and out of the tree while off screen: the masthead
      // below is the same navigation, and two copies would both be read out.
      aria-hidden={shown ? undefined : "true"}
      inert={!shown}
    >
      <div className="topbar-in">
        <div className="topbar-l">
          <Image
            className="topbar-icon"
            src="/brand/tcg-icon.svg"
            alt=""
            width={235}
            height={235}
            aria-hidden="true"
          />

          <Cta
            variant="icon"
            className={`burger${open ? " is-open" : ""}`}
            label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="megamenu"
            onActivate={() => setOpen((v) => !v)}
          >
            <span className="bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </Cta>

        </div>

        <Image
          className="topbar-word"
          src="/brand/tcg-text.svg"
          alt="TCG"
          width={1032}
          height={232}
        />

        <div className="topbar-r">
          <Cta as="a" href="/sign-in" variant="icon" label="Sign in">
            <User className="glyph" aria-hidden="true" />
          </Cta>
          <Cta as="a" href="/book" label="Book appointment">
            Book appointment
          </Cta>
        </div>
      </div>

      {/* The section titles stay on screen, the Monocle way. */}
      <nav className="topbar-pages" aria-label="Sections">
        <ul>
          {NAV.map((s) => (
            <li key={s.label}>
              <a href={s.href}>{s.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="megamenu" id="megamenu" data-open={open ? "true" : "false"}>
        <div className="megamenu-in">
          {NAV.map((s) => (
            <div className="mega-col" key={s.label}>
              <a className="mega-head" href={s.href} onClick={() => setOpen(false)}>
                {s.label}
              </a>
              <ul>
                {s.children.map(([href, label]) => (
                  <li key={label}>
                    <a href={href} onClick={() => setOpen(false)}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
