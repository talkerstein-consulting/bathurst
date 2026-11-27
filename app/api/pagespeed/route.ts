import { NextResponse } from "next/server";
import { toSiteUrl } from "@/lib/domain";

/**
 * The assessment itself: Google's PageSpeed Insights (Lighthouse) run server-side.
 *
 * It runs here rather than in the browser so the API key never reaches the client and
 * the quota is ours to watch. PSI answers without a key at a low rate; set
 * PAGESPEED_API_KEY in .env.local before this sees campaign traffic, or the first busy
 * hour returns 429 to real visitors.
 *
 * Only the three categories the landing page shows are requested — performance,
 * accessibility and best practices — because each extra category is another Lighthouse
 * pass and PSI is already the slowest thing on the page.
 *
 * G02/SSRF: the URL is parsed and rebuilt by toSiteUrl before it goes anywhere, and the
 * only host this route ever fetches is googleapis.com. It is a public, unauthenticated
 * lookup of a public website; nothing is stored.
 */

const PSI = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const CATEGORIES = ["performance", "accessibility", "best-practices"] as const;

/* No `runtime` export: this project has cacheComponents on, which rejects one, and
   Node is the default for a route handler anyway. */
/* A Lighthouse run is slow. Vercel's default would cut it off mid-audit. */
export const maxDuration = 60;

type Audit = {
  title?: string;
  displayValue?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  details?: { overallSavingsMs?: number };
};
type Lighthouse = {
  lighthouseResult?: {
    categories?: Record<
      string,
      { score?: number | null; title?: string; auditRefs?: { id: string; weight?: number; group?: string }[] }
    >;
    audits?: Record<string, Audit>;
  };
};

/**
 * The fixes: Lighthouse's own failing audits across the three categories, in its own
 * wording, ranked the way PageSpeed ranks its Opportunities — estimated time saved
 * first, then how much the audit weighs in its category times how badly it failed.
 * Metrics (the timings themselves) are not fixes and are left out. Nothing here is
 * written by us: the title is Google's, the figure is Google's displayValue.
 */
const MAX_FIXES = 8;
function fixesFrom(lh: NonNullable<Lighthouse["lighthouseResult"]>) {
  const audits = lh.audits ?? {};
  const weight = new Map<string, number>();
  const metrics = new Set<string>();
  for (const c of CATEGORIES) {
    for (const ref of lh.categories?.[c]?.auditRefs ?? []) {
      if (ref.group === "metrics") metrics.add(ref.id);
      weight.set(ref.id, Math.max(weight.get(ref.id) ?? 0, ref.weight ?? 0));
    }
  }
  const scored = new Set(["numeric", "binary", "metricSavings"]);
  return Object.entries(audits)
    .filter(([id, a]) =>
      !metrics.has(id) &&
      typeof a.score === "number" && a.score < 0.9 &&
      scored.has(a.scoreDisplayMode ?? "") &&
      typeof a.title === "string" && a.title.length > 0,
    )
    .map(([id, a]) => ({
      id,
      title: a.title as string,
      detail: a.displayValue ?? null,
      saves: a.details?.overallSavingsMs ?? 0,
      impact: (weight.get(id) ?? 0) * (1 - (a.score as number)),
    }))
    .sort((x, y) => y.saves - x.saves || y.impact - x.impact)
    .slice(0, MAX_FIXES)
    .map(({ id, title, detail }) => ({ id, title, detail }));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a website address." }, { status: 400 });
  }

  const site = toSiteUrl(typeof (body as { url?: unknown })?.url === "string" ? (body as { url: string }).url : "");
  if (!site) {
    return NextResponse.json(
      { error: "That doesn’t look like a website address. Try it as example.com." },
      { status: 400 },
    );
  }

  const query = new URLSearchParams({ url: site, strategy: "mobile" });
  for (const c of CATEGORIES) query.append("category", c);
  const key = process.env.PAGESPEED_API_KEY;
  if (key) query.set("key", key);

  let answer: Response;
  try {
    answer = await fetch(`${PSI}?${query}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return NextResponse.json(
      { error: "The check timed out. Try again in a moment." },
      { status: 504 },
    );
  }

  if (!answer.ok) {
    /* PSI is specific about why it could not reach a site, and that reason is the most
       useful thing we can say. It is Google's own text, not ours, so it is shown as the
       reason rather than as our copy. */
    const detail = await answer
      .json()
      .then((d: { error?: { message?: string } }) => d?.error?.message)
      .catch(() => undefined);
    return NextResponse.json(
      {
        error:
          answer.status === 429
            ? "The checker is busy right now. Try again in a minute."
            : detail || "We couldn’t reach that website.",
      },
      { status: answer.status === 429 ? 429 : 502 },
    );
  }

  const data = (await answer.json()) as Lighthouse;
  const cats = data.lighthouseResult?.categories ?? {};
  const score = (name: string) => {
    const raw = cats[name]?.score;
    return typeof raw === "number" ? Math.round(raw * 100) : null;
  };

  const performance = score("performance");
  const accessibility = score("accessibility");
  const practices = score("best-practices");

  if (performance === null && accessibility === null && practices === null) {
    return NextResponse.json(
      { error: "The check came back empty. Try again in a moment." },
      { status: 502 },
    );
  }

  const audits = data.lighthouseResult?.audits ?? {};
  return NextResponse.json(
    {
      url: site,
      strategy: "mobile",
      scores: { performance, accessibility, practices },
      /* The two numbers an owner actually feels, in Lighthouse's own wording. */
      timings: {
        paint: audits["first-contentful-paint"]?.displayValue ?? null,
        usable: audits["largest-contentful-paint"]?.displayValue ?? null,
      },
      fixes: data.lighthouseResult ? fixesFrom(data.lighthouseResult) : [],
    },
    { headers: { "cache-control": "no-store" } },
  );
}
