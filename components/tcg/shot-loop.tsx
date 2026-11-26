"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * A project's mockup render when that render is a loop rather than a still.
 *
 * The set is a photograph and only the screen moves, so the clip reads as
 * footage of the device rather than as an animation on the card — which is why
 * it can sit in the art slot where a still sits, at the same size, with no
 * controls and nothing to press. It is silent and it carries no information a
 * visitor could miss; the card's words say what the project is.
 *
 * D11 / reduced motion: the clip is not loaded at all under
 * prefers-reduced-motion. The poster frame is served as an ordinary image
 * instead, so the card still shows the same picture. That is a decision made
 * here rather than in CSS, because CSS can hide a video but cannot stop it
 * playing or downloading.
 *
 * G13: the media query listener and the observer are both released.
 *
 * It only plays while it is on screen. A loop running in a section nobody has
 * scrolled to is a decoder and a radio kept awake for no one.
 */
export function ShotLoop({
  id,
  sizes,
}: {
  /** The file stem in public/work: <id>.mp4 and <id>-poster.webp. */
  id: string;
  sizes: string;
}) {
  const video = useRef<HTMLVideoElement | null>(null);
  /* null until the query has been read on the client. The still is what the
     server renders, so a visitor who wants no motion never sees a frame of
     it — the clip is swapped in afterwards, not the other way round. */
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setMotion(!q.matches);
    read();
    q.addEventListener("change", read);
    return () => q.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [motion]);

  if (!motion) {
    return (
      <Image
        className="card-shot"
        src={`/work/${id}-poster.webp`}
        alt=""
        fill
        sizes={sizes}
      />
    );
  }

  return (
    <video
      ref={video}
      className="card-shot card-shot--loop"
      poster={`/work/${id}-poster.webp`}
      src={`/work/${id}.mp4`}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}
