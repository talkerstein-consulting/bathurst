"use client";

import { useEffect } from "react";

/**
 * STYLE.md §3 line system, ported from style-preview.html.
 * Renders the shared #grunge filter once and draws the lines for every element on the page:
 *   .frame   outer + inner rounded rectangles
 *   .single  one thin line on the edge
 *   .sprout  (.btn / .link / .field-box) inner line at rest, an outer line that sprouts on hover / focus
 * A MutationObserver picks up markup the map engine creates after mount (chips, sheet rows, callouts),
 * and a ResizeObserver redraws when a box changes size. Lines are aria-hidden SVG; layout never depends on them.
 */
export default function LineSystem() {
  useEffect(() => {
    const root = document.documentElement;
    const SVGNS = "http://www.w3.org/2000/svg";
    const cssNum = (n: string) => parseFloat(getComputedStyle(root).getPropertyValue(n)) || 0;
    type El = HTMLElement & { _built?: boolean; _open?: boolean; _seeded?: boolean; _outerD?: string; _perimeter?: number; _t?: number };

    // Layout size, not the on-screen box: map callouts are scaled with transforms, which must not shrink their lines.
    // The line SVG always spans the border box (transparent border = outer stroke, or no border on .single / .link).
    const size = (el: HTMLElement) => ({ W: el.offsetWidth, H: el.offsetHeight });

    // Twin label for CTAs the map engine builds (React CTAs render their own; see components/style/Cta.tsx).
    function ensureLabel(el: El) {
      if (el.classList.contains("field-box") || el.querySelector(":scope > .label")) return;
      const isIcon = el.classList.contains("icon");
      const content = el.innerHTML;
      if (!isIcon && !el.getAttribute("aria-label")) el.setAttribute("aria-label", el.textContent?.trim() ?? "");
      const label = document.createElement("span");
      label.className = "label";
      label.setAttribute("aria-hidden", "true");
      label.innerHTML = `<span>${content}</span><span>${content}</span>`;
      el.innerHTML = "";
      el.appendChild(label);
    }

    function sprout(el: El) {
      if (!el._built) {
        el._built = true;
        el._open = el.classList.contains("link");
        if (!el.hasAttribute("data-no-tumble")) ensureLabel(el);
        const svg = document.createElementNS(SVGNS, "svg");
        svg.classList.add("stroke");
        svg.setAttribute("aria-hidden", "true");
        svg.innerHTML = '<g filter="url(#grunge)"><path class="inner"/></g>';
        el.prepend(svg);
        // re-seed once the line has fully retracted, never on the way in (fresh paths would skip the grow)
        const sync = () =>
          setTimeout(() => {
            const on = el.matches(":hover, :focus-visible") || (el.classList.contains("field-box") && el.matches(":focus-within"));
            el.classList.toggle("on", on);
            clearTimeout(el._t);
            if (!on) el._t = window.setTimeout(() => { if (!el.classList.contains("on")) seedOuter(el); }, cssNum("--cta-draw") + 150);
          }, 0);
        ["pointerenter", "pointerleave", "focusin", "focusout"].forEach((e) => el.addEventListener(e, sync));
      }
      const svg = el.querySelector(":scope > .stroke") as SVGSVGElement | null;
      if (!svg) return;
      const { W, H } = size(el);
      if (!W) return;
      const so = cssNum("--outer-stroke"), si = cssNum("--inner-stroke"), gap = cssNum("--gap");
      const inner = svg.querySelector(".inner")!;
      if (el._open) {
        const yo = H - so / 2, yi = H - so - gap - si / 2;
        inner.setAttribute("d", `M0 ${yi}H${W}`);
        el._outerD = `M0 ${yo}H${W}`;
        el._perimeter = W;
      } else {
        const R = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, H / 2, W / 2);
        const i = so / 2, r = Math.max(0, R - i), cx = W / 2;
        const j = so + gap + si / 2, rj = Math.max(0, R - j);
        const rrect = (k: number, rk: number) =>
          `M${cx} ${k}H${W - k - rk}A${rk} ${rk} 0 0 1 ${W - k} ${k + rk}V${H - k - rk}A${rk} ${rk} 0 0 1 ${W - k - rk} ${H - k}H${k + rk}A${rk} ${rk} 0 0 1 ${k} ${H - k - rk}V${k + rk}A${rk} ${rk} 0 0 1 ${k + rk} ${k}Z`;
        inner.setAttribute("d", rrect(j, rj));
        el._outerD = rrect(i, r);
        el._perimeter = 2 * (W - 2 * i - 2 * r) + 2 * (H - 2 * i - 2 * r) + 2 * Math.PI * r;
      }
      if (!el._seeded) seedOuter(el);
      else svg.querySelectorAll(".outer").forEach((p) => p.setAttribute("d", el._outerD!));
    }

    // about one seed per 70px of path, evenly spaced from a random start, jittered ±30% of the spacing
    function seedOuter(el: El) {
      if (!el._outerD) return;
      const g = el.querySelector(":scope > .stroke g");
      if (!g) return;
      g.querySelectorAll(".outer").forEach((p) => p.remove());
      const open = el._open, per = el._perimeter ?? 0;
      const n = open ? Math.max(2, Math.min(5, Math.round(per / 70))) : Math.max(3, Math.min(7, Math.round(per / 70)));
      const step = 1 / n, start = open ? step / 2 : Math.random();
      const seeds = Array.from({ length: n }, (_, k) => start + k * step + (Math.random() - 0.5) * 0.6 * step);
      seeds.forEach((sd, k) => {
        let from: number, to: number;
        if (open) {
          from = k ? (seeds[k - 1] + sd) / 2 : 0;
          to = k < n - 1 ? (sd + seeds[k + 1]) / 2 : 1;
        } else {
          const prev = k ? seeds[k - 1] : seeds[n - 1] - 1, next = k < n - 1 ? seeds[k + 1] : seeds[0] + 1;
          from = (prev + sd) / 2;
          to = (sd + next) / 2;
        }
        const len = Math.min(1, to - from + (open ? 0 : 0.002));
        const seedN = open ? sd : ((sd % 1) + 1) % 1;
        const p = document.createElementNS(SVGNS, "path");
        p.setAttribute("class", "outer");
        p.setAttribute("pathLength", "1");
        p.setAttribute("d", el._outerD!);
        p.style.cssText = `--seed:${seedN};--from:${seedN - (sd - from)};--len:${len};--rest:${1 - len};--delay:${Math.round(Math.random() * 90)}ms`;
        g.appendChild(p);
      });
      el._seeded = true;
    }

    function buildFrame(el: El) {
      let svg = el.querySelector(":scope > .lines") as SVGSVGElement | null;
      const single = el.classList.contains("single");
      if (!svg) {
        svg = document.createElementNS(SVGNS, "svg") as SVGSVGElement;
        svg.classList.add("lines");
        svg.setAttribute("aria-hidden", "true");
        svg.innerHTML = single ? '<g filter="url(#grunge)"><rect class="i"/></g>' : '<g filter="url(#grunge)"><rect class="o"/><rect class="i"/></g>';
        el.prepend(svg);
      }
      const { W, H } = size(el);
      if (!W) return;
      const R = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, H / 2, W / 2);
      const so = cssNum("--outer-stroke"), si = cssNum("--inner-stroke"), gap = cssNum("--gap");
      const set = (r: Element, inset: number) => {
        r.setAttribute("x", String(inset));
        r.setAttribute("y", String(inset));
        r.setAttribute("width", String(Math.max(0, W - 2 * inset)));
        r.setAttribute("height", String(Math.max(0, H - 2 * inset)));
        r.setAttribute("rx", String(Math.max(0, R - inset)));
      };
      if (single) set(svg.querySelector(".i")!, (el.classList.contains("hair") ? si : so) / 2);
      else {
        set(svg.querySelector(".o")!, so / 2);
        set(svg.querySelector(".i")!, so + gap + si / 2);
      }
    }

    const SEL = ".sprout, .frame, .single";
    const rebuild = (el: El) => (el.classList.contains("sprout") ? sprout(el) : buildFrame(el));
    const ro = new ResizeObserver((es) => es.forEach((e) => rebuild(e.target as El)));
    const seen = new WeakSet<Element>();
    const attach = (scope: ParentNode) => {
      const list: Element[] = [];
      if (scope instanceof Element && scope.matches(SEL)) list.push(scope);
      scope.querySelectorAll?.(SEL).forEach((e) => list.push(e));
      for (const el of list) {
        if (seen.has(el)) continue;
        seen.add(el);
        rebuild(el as El);
        ro.observe(el);
      }
    };
    attach(document);
    const mo = new MutationObserver((ms) => {
      for (const m of ms) m.addedNodes.forEach((n) => { if (n.nodeType === 1 && !(n as Element).closest(".lines, .stroke, .label")) attach(n as Element); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // fonts change label widths after first paint
    document.fonts?.ready.then(() => document.querySelectorAll(SEL).forEach((e) => rebuild(e as El)));
    return () => { mo.disconnect(); ro.disconnect(); };
  }, []);

  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      {/* Grunge: roughens edges (displacement) and eats speckles out of the line (grain mask). */}
      <filter id="grunge" x="-5%" y="-20%" width="110%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={4} result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale={1.8} xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves={1} seed={11} result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.4" result="speckle" />
        <feComposite in="rough" in2="speckle" operator="in" />
      </filter>
    </svg>
  );
}
