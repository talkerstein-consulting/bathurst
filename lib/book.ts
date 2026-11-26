/**
 * The link to the booking form, with the assessment pre-filled.
 *
 * Written for the home hero (components/home/AssessLead.tsx) and now also used by the
 * campaign landing page, so it lives here. AssessLead re-exports it as `assessHref`.
 */
export const assessHref = (website = "", email = "") =>
  `/book?${new URLSearchParams({
    service: "Website assessment",
    ...(website ? { website } : {}),
    ...(email ? { email } : {}),
  })}`;
