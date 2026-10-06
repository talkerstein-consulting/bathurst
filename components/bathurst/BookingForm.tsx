"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CONTACT, INDUSTRIES, SERVICES } from "@/lib/bathurst/data";
import { GOALS } from "@/components/bathurst/DirectionsPanel";
import { brandSelect } from "@/lib/bathurst/brand-select";

/**
 * Get directions: the booking form, laid out as a route. Three stops (Starting point, Destination, Your details) on a rail,
 * and a live From → To card beside them. Posts JSON to /api/book (which forwards it to the CRM webhook); if that isn't
 * connected or fails, the visitor gets the same request as a pre-filled email, so nothing is lost.
 * Prefill: ?from= (business), ?goal= (a GOALS key), ?service= (a SERVICES name or short name), all from the map's own CTAs.
 */
const TIMELINES = ["As soon as possible", "In the next 1–3 months", "In 3–6 months", "Just exploring"];
type Status = "idle" | "sending" | "sent" | "fallback";

function Field({ label, name, type = "text", required, value, onChange, autoComplete, invalid }: {
  label: string; name: string; type?: string; required?: boolean; value: string; onChange: (v: string) => void; autoComplete?: string; invalid?: boolean;
}) {
  return (
    <label className="field bk-field">
      <span className="sprout field-box">
        <input className="input" name={name} type={type} placeholder=" " required={required} value={value} autoComplete={autoComplete}
          aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value)} />
        <span className="float" aria-hidden="true"><span className="as-ph">{label}{required ? "" : " (optional)"}</span><span className="as-label">{label}</span></span>
      </span>
      <span className="sr-only">{label}{required ? "" : " (optional)"}</span>
    </label>
  );
}

function Select({ label, value, onChange, options, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][]; placeholder: string; required?: boolean;
}) {
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(() => { if (ref.current) brandSelect(ref.current)(); }, [value]);
  return (
    <label className="field is-raised bk-field">
      <span className="sprout field-box">
        <select ref={ref} className="input" aria-label={label} required={required} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>{placeholder}</option>
          {options.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <span className="caret"><svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></span>
        <span className="float" aria-hidden="true"><span className="as-ph" /><span className="as-label">{label}</span></span>
      </span>
    </label>
  );
}

export default function BookingForm({ initial }: { initial: { from: string; goal: string; service: string } }) {
  const svcMatch = SERVICES.find((s) => [s.name, s.short, s.slug].some((x) => x.toLowerCase() === initial.service.toLowerCase()));
  const [f, setF] = useState({
    business: initial.from, website: "", industry: "", goal: GOALS.some(([k]) => k === initial.goal) ? initial.goal : "",
    obstacle: "", timeline: "", name: "", email: "", phone: "", company_url: "",
  });
  const [services, setServices] = useState<string[]>(svcMatch ? [svcMatch.short] : []);
  const [status, setStatus] = useState<Status>("idle");
  const [invalid, setInvalid] = useState<string[]>([]);
  const set = (k: keyof typeof f) => (v: string) => { setF((o) => ({ ...o, [k]: v })); setInvalid((x) => x.filter((y) => y !== k)); };
  const goalLabel = GOALS.find(([k]) => k === f.goal)?.[1] ?? "";
  const toggle = (s: string) => setServices((o) => (o.includes(s) ? o.filter((x) => x !== s) : [...o, s]));

  const mailto = () => {
    const lines = [
      `Business: ${f.business}`, f.website && `Website: ${f.website}`, f.industry && `Industry: ${INDUSTRIES[f.industry as keyof typeof INDUSTRIES]?.name ?? f.industry}`,
      `Destination: ${goalLabel}`, services.length && `Services: ${services.join(", ")}`, f.timeline && `Timeline: ${f.timeline}`,
      f.obstacle && `\nWhat's in the way:\n${f.obstacle}`, `\n${f.name}`, f.email, f.phone,
    ].filter(Boolean).join("\n");
    return `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Get directions: ${f.business} → ${goalLabel}`)}&body=${encodeURIComponent(lines)}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const miss = (["business", "goal", "name", "email"] as const).filter((k) => !f[k].trim());
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) miss.push("email");
    if (miss.length) { setInvalid(miss); document.querySelector<HTMLElement>(`[name="${miss[0]}"], .bk-goal .bsel-btn`)?.focus(); return; }
    setStatus("sending");
    try {
      const res = await fetch("/api/book", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, goalLabel, services, source: initial.from || initial.goal ? "map" : initial.service ? "services" : "direct", page: location.href }) });
      setStatus(res.ok ? "sent" : "fallback");
    } catch { setStatus("fallback"); }
  };

  if (status === "sent") return (
    <div className="bk-done frame" role="status">
      <p className="eyebrow">Route received</p>
      <h2 className="h2">You’re on your way, {f.name.split(" ")[0]}.</h2>
      <p>We’ll look at {f.business}{f.website ? " and its website" : ""} and reply within one business day with the first stop: a time for your Business Diagnostic.</p>
      <Link className="link" href="/">Back to the map</Link>
    </div>
  );

  return (
    <form className="bk-form" onSubmit={submit} noValidate>
      <ol className="bk-stops">
        <li className="bk-stop">
          <span className="bk-dot" aria-hidden="true" />
          <h2 className="bk-h"><small>01</small>Starting point</h2>
          <Field label="Business name" name="business" required value={f.business} onChange={set("business")} autoComplete="organization" invalid={invalid.includes("business")} />
          <div className="bk-row">
            <Field label="Website" name="website" type="url" value={f.website} onChange={set("website")} autoComplete="url" />
            <Select label="Industry" value={f.industry} onChange={set("industry")} placeholder="Your industry (optional)"
              options={Object.entries(INDUSTRIES).filter(([k]) => k !== "services").map(([k, v]) => [k, v.name])} />
          </div>
        </li>
        <li className="bk-stop">
          <span className="bk-dot" aria-hidden="true" />
          <h2 className="bk-h"><small>02</small>Destination</h2>
          <div className={`bk-goal${invalid.includes("goal") ? " bk-invalid" : ""}`}>
            <Select label="Where do you want to go?" value={f.goal} onChange={set("goal")} placeholder="Choose your destination" options={GOALS} required />
          </div>
          <fieldset className="bk-svcs">
            <legend className="eyebrow">Services you’re considering <span>(optional)</span></legend>
            {SERVICES.map((s) => (
              <button key={s.slug} type="button" className="sprout btn sm bk-chip" data-no-tumble aria-pressed={services.includes(s.short)} onClick={() => toggle(s.short)}>{s.short}</button>
            ))}
          </fieldset>
          <label className="field bk-field">
            <span className="sprout field-box">
              <textarea className="input bk-area" name="obstacle" placeholder=" " rows={4} value={f.obstacle} onChange={(e) => set("obstacle")(e.target.value)} />
              <span className="float" aria-hidden="true"><span className="as-ph">What’s in the way right now? (optional)</span><span className="as-label">What’s in the way</span></span>
            </span>
            <span className="sr-only">What’s in the way right now? (optional)</span>
          </label>
          <Select label="Timeline" value={f.timeline} onChange={set("timeline")} placeholder="When do you want to get there? (optional)" options={TIMELINES.map((t) => [t, t])} />
        </li>
        <li className="bk-stop">
          <span className="bk-dot end" aria-hidden="true"><svg className="glyph" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg></span>
          <h2 className="bk-h"><small>03</small>Your details</h2>
          <Field label="Your name" name="name" required value={f.name} onChange={set("name")} autoComplete="name" invalid={invalid.includes("name")} />
          <div className="bk-row">
            <Field label="Email" name="email" type="email" required value={f.email} onChange={set("email")} autoComplete="email" invalid={invalid.includes("email")} />
            <Field label="Phone" name="phone" type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" />
          </div>
        </li>
      </ol>
      {/* honeypot: hidden from people, filled by bots */}
      <input className="bk-hp" name="company_url" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.company_url} onChange={(e) => set("company_url")(e.target.value)} />
      {invalid.length > 0 && <p className="bk-err" role="alert">Fill in the highlighted fields to get your directions.</p>}
      {status === "fallback" && (
        <div className="bk-err" role="alert">
          We couldn’t send this from the page just now. <a href={mailto()}>Send it as an email instead</a> (it’s all filled in), or call <a href={CONTACT.tel}>{CONTACT.phone}</a>.
        </div>
      )}
      <div className="bk-submit">
        <button type="submit" className="sprout btn orange dc-go bk-go" data-no-tumble disabled={status === "sending"}>
          <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></svg>
          {status === "sending" ? "Mapping your route…" : "Get directions"}
        </button>
        <p className="book-fine">We reply within one business day. No hard sell, and we never share your details.</p>
      </div>
      {/* the live route card: what the visitor has told us so far */}
      <aside className="bk-route frame" aria-label="Your route">
        <p className="eyebrow">Your route</p>
        <div className="dc-route">
          <span className="rail" aria-hidden="true"><i className="dot" /><i className="dots" /><span className="rpin"><svg className="glyph" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg></span></span>
          <dl>
            <div><dt>From</dt><dd className={f.business ? "" : "ph"}>{f.business || "Your business"}</dd></div>
            <div><dt>To</dt><dd className={goalLabel ? "" : "ph"}>{goalLabel || "Your destination"}</dd></div>
          </dl>
        </div>
        {services.length > 0 && <p className="bk-via"><span>Via</span> {services.join(" · ")}</p>}
        <p className="bk-alt">Rather talk now? <a href={CONTACT.tel}>{CONTACT.phone}</a> · <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
      </aside>
    </form>
  );
}
