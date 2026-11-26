/**
 * The domain completer, shared by every URL field on the site.
 *
 * It was written for the home hero's assessment field (components/home/AssessLead.tsx)
 * and is now also the campaign landing page's field (components/tcg/check-lead.tsx),
 * so it lives here rather than inside either screen. AssessLead re-exports it, so the
 * old import path still resolves.
 *
 * It only ever offers a top-level domain, never a name, so it cannot put words in
 * anyone's mouth; it stays quiet once a known one is complete, and on anything with a
 * space or a path in it.
 */
const TLDS = [".ca", ".com", ".co", ".net", ".org"];   // a Toronto agency: .ca and .com first

export function completeDomain(value: string) {
  const v = value.trim().replace(/^https?:\/\//i, "");
  if (!v || /[\s/?#]/.test(v) || v.length < 3) return "";
  const dot = v.lastIndexOf(".");
  if (dot < 0) return ".com";                                  // no dot yet: the commonest ending
  const tail = v.slice(dot);                                   // ".c", ".co", ".com"
  if (TLDS.includes(tail)) return "";                          // already a whole one: say nothing
  const hit = TLDS.find((t) => t.startsWith(tail));
  return hit ? hit.slice(tail.length) : "";
}

/** What the visitor typed, as a URL we are willing to hand to PageSpeed. */
export function toSiteUrl(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    // A hostname with a dot and no credentials. Anything else is not a public website.
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)) return "";
    if (u.username || u.password) return "";
    return u.toString();
  } catch {
    return "";
  }
}
