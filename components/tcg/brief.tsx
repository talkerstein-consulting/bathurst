"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * The brief: what the visitor has handed us before they have typed anything.
 *
 * The cards and the intake box are siblings in the page (app/page.tsx), so a
 * card cannot reach into the box and the box cannot watch the cards. This
 * provider is the one thing both of them touch: the cards start a drag, the box
 * says where it is and renders what landed.
 *
 * The drag itself is deliberately NOT in React state. A pointer move is 120
 * events a second, and a render here is the hero canvas, the map and every card
 * along with it. The ghost is one fixed element the provider owns and moves by
 * writing `transform` straight onto the node; only the things that change a
 * handful of times per drag — is a drag running, is it over the box, what has
 * been dropped — are state.
 *
 * WHAT STOPS A DRAG, AND WHAT MUST NOT
 *
 * A first pass gated dragging on `(hover: hover) and (pointer: fine)` and on
 * `prefers-reduced-motion`. Both were wrong, and between them they switched the
 * feature off on ordinary Windows machines:
 *
 *  - A touchscreen laptop reports `pointer: coarse` as its PRIMARY pointer even
 *    with a mouse plugged in, so the media query said "no fine pointer" while
 *    the visitor was holding one.
 *  - Reduced motion is a request for less animation, not for fewer features.
 *    Windows has that setting on by default for a lot of people.
 *
 * So the decision is made per event, from `pointerType`, which is the only
 * thing that actually knows what is touching the screen; and reduced motion is
 * handled where it belongs, in the stylesheet, by not animating the ghost.
 *
 * Touch is still left out on purpose: the card row is a sideways tray on a
 * phone and a drag would need `touch-action: none`, which takes the swipe away
 * from it. Touch adds with a press instead, which is the shorter route anyway.
 */

export type Chip = { id: string; label: string };

type BriefApi = {
  /** What has been dropped into the box, in drop order. */
  chips: Chip[];
  /** Add a label, ignoring a repeat. */
  add: (label: string) => void;
  remove: (id: string) => void;
  /** The box tells the provider where it is; null on unmount. */
  setDropZone: (el: HTMLElement | null) => void;
  /** A card starts a drag. Safe to call on any pointer; it opts out itself. */
  startDrag: (label: string, e: React.PointerEvent) => void;
  /** True while a drag is running, for the cards' own dimming. */
  dragging: boolean;
  /** True while that drag is over the box, so the box can light up. */
  over: boolean;
};

const Ctx = createContext<BriefApi | null>(null);

/** The box and the cards both call this. Outside a provider they get null and
 *  fall back to their plain, undraggable selves rather than throwing. */
export function useBrief() {
  return useContext(Ctx);
}

/** How far the pointer must travel before a press becomes a drag, so a plain
 *  click still reads as a click. */
const SLOP = 6;

export function BriefProvider({ children }: { children: ReactNode }) {
  const [chips, setChips] = useState<Chip[]>([]);
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState(false);
  /** The title under the cursor. Set once, when the press becomes a drag. */
  const [label, setLabel] = useState("");

  const ghost = useRef<HTMLDivElement | null>(null);
  const zone = useRef<HTMLElement | null>(null);
  /** The live drag. Null between drags. */
  const drag = useRef<{
    label: string;
    id: number;
    el: HTMLElement;
    from: { x: number; y: number };
    live: boolean;
  } | null>(null);

  /** One feature at a time: adding a card replaces whichever one is loaded,
      and that card drops back to its unheld state on its own (its "held" is
      read from this list). Re-adding the loaded card changes nothing. */
  const add = useCallback((label: string) => {
    setChips((cur) =>
      cur.length === 1 && cur[0].label === label ? cur : [{ id: label, label }],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setChips((cur) => cur.filter((c) => c.id !== id));
  }, []);

  const setDropZone = useCallback((el: HTMLElement | null) => {
    zone.current = el;
  }, []);

  /** Is this point inside the box? Measured per call: the page scrolls under a
   *  drag, so a rect cached at pointerdown would be wrong by the time it ends. */
  const inZone = useCallback((x: number, y: number) => {
    const el = zone.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }, []);

  const place = useCallback((x: number, y: number) => {
    const g = ghost.current;
    if (!g) return;
    g.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }, []);

  /** Put everything back, however the drag ended. */
  const clear = useCallback(() => {
    const d = drag.current;
    if (d) {
      // Releasing a capture the element no longer holds throws; it is not worth
      // a branch, and a failure here must not strand the drag state.
      try {
        d.el.releasePointerCapture(d.id);
      } catch {}
    }
    drag.current = null;
    setDragging(false);
    setOver(false);
  }, []);

  const startDrag = useCallback((label: string, e: React.PointerEvent) => {
    // Touch keeps its swipe (see the note at the top); a press still adds.
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;

    const el = e.currentTarget as HTMLElement;
    /* Capture, so every move and the release come back to this element even
       when the pointer is over the hero canvas, the map or outside the window.
       Without it a fast drag across another section loses its own pointerup
       and the ghost is left hanging. */
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}

    drag.current = {
      label,
      id: e.pointerId,
      el,
      from: { x: e.clientX, y: e.clientY },
      live: false,
    };
  }, []);

  /**
   * One set of window listeners for every card, bound once. A card that bound
   * its own would keep them past its own unmount, and four cards would each pay
   * for a move the other three ignore.
   *
   * These still fire under pointer capture: capture retargets the event to the
   * captured element, and it bubbles from there to the window as usual.
   *
   * G13: all of them come off on teardown, along with any drag in flight.
   */
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;

      if (!d.live) {
        const far =
          Math.abs(e.clientX - d.from.x) > SLOP ||
          Math.abs(e.clientY - d.from.y) > SLOP;
        if (!far) return;
        d.live = true;
        setLabel(d.label);
        setDragging(true);
        // Placed before the ghost is first painted, so it never flashes at the
        // top-left corner on its way to the pointer.
        place(e.clientX, e.clientY);
      }

      place(e.clientX, e.clientY);
      setOver(inZone(e.clientX, e.clientY));
      // A live drag owns the pointer: no selection, no scroll chaining.
      e.preventDefault();
    };

    const up = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      const wasLive = d.live;
      const label = d.label;
      const landed = inZone(e.clientX, e.clientY);
      clear();
      // A press that never travelled is a click, and the card's own button
      // handles it — adding here as well would add it twice.
      if (wasLive && landed) add(label);
    };

    /* A drag can also end without a pointerup: the tab loses focus, the browser
       takes the pointer back, or something cancels the gesture. Each of these
       drops the drag rather than leaving a ghost stuck to the page. */
    const cancel = () => {
      if (drag.current) clear();
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("lostpointercapture", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("lostpointercapture", cancel);
      window.removeEventListener("blur", cancel);
      clear();
    };
  }, [add, inZone, place, clear]);

  const api = useMemo<BriefApi>(
    () => ({ chips, add, remove, setDropZone, startDrag, dragging, over }),
    [chips, add, remove, setDropZone, startDrag, dragging, over],
  );

  return (
    <Ctx.Provider value={api}>
      {children}

      {/* The thing under the cursor. It is the card's title in the card's own
          setting while it is loose, and folds into the chip it is about to
          become once it is over the box — the same object, not a swap.

          aria-hidden because the drag is already announced by the card's own
          button and the chip that lands; a second live region would read the
          same title twice. */}
      <div
        className="brief-ghost"
        data-live={dragging ? "true" : "false"}
        data-chip={over ? "true" : "false"}
        ref={ghost}
        aria-hidden="true"
      >
        <span className="brief-ghost-in">{label}</span>
      </div>
    </Ctx.Provider>
  );
}
