import { useEffect, useRef, useState } from "react";
import BathurstStreet from "./BathurstStreet";

export default function ClientMapSection() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const plate = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const dispose = useRef<() => void>(() => {});

  useEffect(() => () => dispose.current(), []);
  useEffect(() => {
    if (open) {
      plate.current?.scrollIntoView({block: "start", behavior: "instant"});
    } else if (mounted) {
      const delay = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 580;
      const timer = setTimeout(() => {
        dispose.current();
        setMounted(false);
        setReady(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  function loaded() {
    dispose.current();
    const stick = frame.current?.contentDocument?.getElementById("stick");
    if (!stick || stick.classList.contains("mapready")) { setReady(true); return; }
    function show() { dispose.current(); setReady(true); }
    const observer = new MutationObserver(() => { if (stick?.classList.contains("mapready")) show(); });
    observer.observe(stick, {attributes: true, attributeFilter: ["class"]});
    const fallback = setTimeout(show, 3500);
    dispose.current = () => {observer.disconnect(); clearTimeout(fallback);};
  }

  const label = open ? "Close map" : "Explore the client map";
  return <section className="mapwide" data-open={open} data-revealed={open && ready}>
    <div className="wrap"><div className="map-shell">
      <button type="button" className="map-toggle" aria-controls="client-map" aria-expanded={open}
        aria-label={label} onClick={() => {setMounted(true); setOpen(!open);}}>
        <span className="map-pill" aria-hidden="true">
          <span key={label} className="map-label">{label}</span>
          <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15 15 5 M5.5 5H15v9.5" /></svg>
        </span>
      </button>
      <div ref={plate} className="mapplate" id="client-map">
        <div className="map-poster"><BathurstStreet /></div>
        <div className="map-surface" inert={!open || !ready} aria-hidden={!open || !ready}>
          {mounted && <iframe ref={frame} src="/map" onLoad={loaded} title="Interactive map of Talkerstein projects across the GTA" />}
        </div>
      </div>
    </div></div>
  </section>;
}
