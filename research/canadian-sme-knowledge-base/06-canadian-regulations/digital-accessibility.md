---
title: "Digital Accessibility Rules for Ontario and Canadian Small Businesses (AODA and the Accessible Canada Act)"
pillar: "All"
geography:
  - Canada
  - Ontario
  - Toronto
last_updated: "2026-11-12"
source_count: 4
document_type: "research"
---

# Digital Accessibility Rules for Ontario and Canadian Small Businesses (AODA and the Accessible Canada Act)

This file covers Ontario's Accessibility for Ontarians with Disabilities Act (AODA) as it applies to private businesses and their websites, the AODA compliance report, and the federal Accessible Canada Act for federally regulated businesses. Other Ontario employer rules are in [ontario-requirements.md](ontario-requirements.md); federally regulated businesses are introduced in [federal-requirements.md](federal-requirements.md).

**This is general information, not legal advice.** Pages were read on 2026-11-12; each page's "updated" date is given.

## AODA requirements by business size

From Ontario's [Accessibility rules for businesses and non-profits](https://www.ontario.ca/page/accessibility-rules-businesses-and-non-profits) (updated 2026-06-16). Employee counts include full-time, part-time, seasonal and contract workers **in Ontario**; volunteers and independent contractors are not counted. Organizations with no Ontario employees are exempt.

| Requirement | 1 to 19 employees | 20 to 49 employees | 50+ employees |
|---|---|---|---|
| Accessible customer service (assistive devices, service animals, support persons, disruption notices) | Yes | Yes | Yes, plus documented policies |
| Staff and volunteer training (Human Rights Code, accessible service) | Yes | Yes | Yes, plus written training records |
| Accessible feedback methods | Yes | Yes | Yes |
| Accessible information on request, at no extra cost | Yes | Yes | Yes |
| Accessible employment practices | Yes | Yes | Yes, plus individual accommodation and return-to-work plans |
| Accessible public website (WCAG 2.0 AA) | Not required | Not required | Yes |
| Multi-year accessibility plan, posted online | No | No | Yes, reviewed at least every 5 years |
| Accessibility compliance report | No | Every 3 years | Every 3 years |

## Which websites must meet WCAG 2.0 Level AA in Ontario

From Ontario's [How to make websites accessible](https://www.ontario.ca/page/how-make-websites-accessible) (updated 2026-09-21):

- Since **January 1, 2021**, public websites must be accessible if the organization is a designated public sector organization or a **business or non-profit with 50 or more employees** (in Ontario).
- The standard is **WCAG 2.0 Level AA** (which includes Level A), with two exemptions: live captions (1.2.4) and pre-recorded audio descriptions (1.2.5).
- It applies to websites and web content published **after January 1, 2012**, and to the organization that controls the site directly or through a contract (so a site built by an agency is still the client's responsibility).
- Internal sites (intranets, extranets) do not have to meet WCAG, but the organization must provide content in an accessible format on request.

**Note:** Businesses under 50 employees are not required to meet WCAG on their website, but they still must provide information in an accessible format on request. **Recommendation:** Build every new site to at least WCAG 2.0 AA (or the newer WCAG 2.1/2.2 AA) anyway; it costs little at build time, helps customers with disabilities and supports growth past 50 employees.

## The 2026 AODA accessibility compliance report

From Ontario's [Completing your accessibility compliance report](https://www.ontario.ca/page/completing-your-accessibility-compliance-report) (updated 2026-02-19):

- **Who files:** businesses and non-profits with **20 or more employees**, every three years.
- **Deadline:** **December 31, 2026**.
- **How:** through the online Accessibility Compliance Reporting Portal (create an account, choose "New Submission", then "Accessibility Compliance Report"). You need your legal name, business number (BN9), employee count and the certifier's contact details. Up to 20 organizations with identical answers can file together.
- **Enforcement:** the province audits and inspects organizations; not filing can bring "enforcement measures which can include financial penalties". The page gives no amounts.

Businesses with fewer than 20 employees do not file, but must still comply ([Accessibility rules for businesses and non-profits](https://www.ontario.ca/page/accessibility-rules-businesses-and-non-profits)).

## Accessible Canada Act: federally regulated businesses only

The federal Accessible Canada Act (ACA) applies to federal entities and **federally regulated businesses** such as banks, airlines, telecoms and interprovincial transport, not to typical provincially regulated Toronto shops or service firms. From [Summary of the Accessible Canada Regulations](https://www.canada.ca/en/employment-social-development/programs/accessible-canada/regulations-summary-act.html) (dated 2023-06-16):

| Size (federally regulated business) | First accessibility plan due | Ongoing |
|---|---|---|
| 100+ employees | June 1, 2023 | Update plan every 3 years; progress reports on the 1st and 2nd anniversaries |
| 10 to 99 employees | June 1, 2024 | Same cycle |
| 9 or fewer | Exempt from plans, progress reports and feedback process descriptions | n/a |

- Maximum penalties: up to $250,000 (very serious), $150,000 (serious) and $75,000 (minor), lower for small businesses.

## Practical website accessibility checklist

**Recommendation** (checklist based on WCAG 2.0 AA principles, our summary, not an official Ontario list):

- Every image that carries meaning has alt text; decorative images are hidden from screen readers.
- Text and background colours meet WCAG AA contrast ratios (check with a contrast tool).
- The whole site works with a keyboard alone, with a visible focus outline.
- Forms have visible labels and clear error messages, not placeholder text only.
- Headings are in order (one H1, then H2/H3) and links describe their destination ("Book a consultation", not "Click here").
- Videos have captions; audio has transcripts.
- Pages work at 200% zoom and on a phone without sideways scrolling.
- PDFs (menus, price lists, forms) are tagged and accessible, or the content is also on an HTML page.
- An accessibility statement and a feedback contact (phone and email) are on the site, which also covers the AODA feedback requirement.
- Re-test after each redesign; automated scanners catch only part of the issues, so include a manual keyboard and screen-reader check.
