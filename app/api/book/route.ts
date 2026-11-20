/**
 * Get directions (the /book form) posts here as JSON. This validates the request and forwards it to the CRM / automation webhook.
 *
 * TODO(integration): set BOOKING_WEBHOOK_URL (e.g. a HubSpot, Zapier, Make or GoHighLevel inbound webhook) in the deployment's
 * environment. Optional BOOKING_WEBHOOK_SECRET is sent as `Authorization: Bearer …`. Until the URL is set this answers 503 and the
 * form offers a pre-filled email instead, so no request is ever silently dropped.
 *
 * Payload sent to the webhook:
 *   { business, website, industry, goal, goalLabel, services[], obstacle, timeline, name, email, phone, source, page, submittedAt }
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const str = (k: string, max = 500) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");

  // honeypot: a field people never see; bots fill it. Answer as if it worked, send nothing.
  if (str("company_url")) return Response.json({ ok: true });

  const lead = {
    business: str("business", 200),
    website: str("website", 300),
    industry: str("industry", 100),
    goal: str("goal", 50),
    goalLabel: str("goalLabel", 100),
    services: Array.isArray(body.services) ? body.services.filter((s): s is string => typeof s === "string").slice(0, 12).map((s) => s.slice(0, 60)) : [],
    obstacle: str("obstacle", 4000),
    timeline: str("timeline", 100),
    name: str("name", 200),
    email: str("email", 254),
    phone: str("phone", 50),
    source: str("source", 100),
    page: str("page", 300),
    submittedAt: new Date().toISOString(),
  };

  const missing = (["business", "goal", "name", "email"] as const).filter((k) => !lead[k]);
  if (missing.length) return Response.json({ ok: false, error: "missing-fields", fields: missing }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return Response.json({ ok: false, error: "invalid-email", fields: ["email"] }, { status: 422 });

  const url = process.env.BOOKING_WEBHOOK_URL;
  if (!url) return Response.json({ ok: false, error: "not-configured" }, { status: 503 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.BOOKING_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.BOOKING_WEBHOOK_SECRET}` } : {}) },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return Response.json({ ok: false, error: "webhook-failed" }, { status: 502 });
  } catch {
    return Response.json({ ok: false, error: "webhook-unreachable" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
