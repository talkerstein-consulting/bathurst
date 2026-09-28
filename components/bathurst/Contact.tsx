"use client";

import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { LEAKS } from "@/lib/bathurst/data";
import { CtaButton } from "@/components/style/Cta";
import { Icon, ARROW_RIGHT } from "./Icon";

const MODES = ["Diagnostic", "Workshop", "Build"] as const;

/** STYLE.md intake: the placeholder rises out of the box and becomes the label on focus. */
function Field({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span className="sprout field-box">
        <input {...input} placeholder=" " className="input" />
        <span className="float">
          <span className="as-ph">{label}</span>
          <span className="as-label" aria-hidden="true">{label}</span>
        </span>
      </span>
    </label>
  );
}

/**
 * Section 7: contact, styled as "directions to a diagnostic".
 * TODO(integration): wire the submit to the CRM / booking tool; it only validates for now.
 */
export default function Contact() {
  const [status, setStatus] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const missing = (["from", "name", "email"] as const).filter((k) => {
      const v = String(data.get(k) ?? "").trim();
      return !v || (k === "email" && !/^\S+@\S+\.\S+$/.test(v));
    });
    if (missing.length) {
      const labels = { from: "your business name", name: "your name", email: "a valid email" };
      setStatus(`Add ${missing.map((k) => labels[k]).join(", ")} to start the route.`);
      (form.elements.namedItem(missing[0]) as HTMLInputElement | null)?.focus();
      return;
    }
    setStatus(`Route planned: ${data.get("from")} to Talkerstein, ${String(data.get("mode")).toLowerCase()} first. This form is not connected yet, so nothing was sent.`);
  }

  return (
    <section id="go" className="section pb-16">
      <div className="wrap split">
        <div>
          <span className="script lead" aria-hidden="true">Let&rsquo;s get you there</span>
          <h2 className="h2 max-w-[12ch]">Get directions to a diagnostic.</h2>
          <p className="mt-4 max-w-[52ch]">A focused working session. You leave with a clear order of operations, whether or not you work with us next.</p>
          <p className="mt-8 text-sm text-steel/70">No long-term commitment. Toronto-based, working with businesses across Canada, the US and beyond.</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="col-r frame grid gap-6 p-12 max-md:p-6">
          <div role="radiogroup" aria-label="What are you booking?" className="grid grid-cols-3 gap-2">
            {MODES.map((m, i) => (
              <label key={m} className="mode sprout btn sm cursor-pointer" data-no-tumble>
                <input type="radio" name="mode" value={m} id={`m${i + 1}`} defaultChecked={i === 0} className="peer absolute inset-0 z-10 cursor-pointer opacity-0" />
                <span className="relative">{m}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-[16px_1fr] gap-x-4">
            <span aria-hidden className="row-span-2 flex h-full flex-col items-center gap-1 pb-7 pt-[52px]">
              <i className="single size-3 rounded-full" />
              <s className="w-0.5 flex-1 bg-[repeating-linear-gradient(var(--steel-50)_0_3px,transparent_3px_6px)]" />
              <i className="single accent size-3 rounded-full" />
            </span>
            <Field label="From: your business" name="from" autoComplete="organization" />
            <Field label="To" value="Talkerstein Consulting Group" readOnly />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Your name" name="name" autoComplete="name" />
            <Field label="Email" name="email" type="email" autoComplete="email" />
          </div>

          <label className="field fixed">
            <span className="sprout field-box">
              <select name="leak" className="input" defaultValue={LEAKS[0]}>
                {LEAKS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <svg className="glyph caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              <span className="float">
                <span className="as-ph">Where is it leaking?</span>
                <span className="as-label" aria-hidden="true">Where is it leaking?</span>
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <CtaButton type="submit" accent label="Start route">Start route<Icon d={ARROW_RIGHT} /></CtaButton>
            <p aria-live="polite" className="min-h-[1.5em] flex-1 text-sm text-steel/70">{status}</p>
          </div>
        </form>
      </div>
    </section>
  );
}
