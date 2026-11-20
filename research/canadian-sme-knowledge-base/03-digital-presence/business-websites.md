---
title: "Business Websites for Canadian SMEs: Requirements, Performance, Security, Maintenance and Investment"
pillar: "Improving Digital Presence"
geography:
  - Canada
  - Ontario
  - Toronto
last_updated: "2026-11-12"
source_count: 8
document_type: "research"
---

# Business Websites for Canadian SMEs: Requirements, Performance, Security, Maintenance and Investment

This file covers what a Canadian small business website needs, Google's Core Web Vitals, website security guidance from the Canadian Centre for Cyber Security, hosting and maintenance, what a website costs, and signs a business has outgrown its site. Conversion design is in [conversion-and-user-experience.md](conversion-and-user-experience.md). Online stores are in [ecommerce.md](ecommerce.md). Accessibility law is in [../06-canadian-regulations/digital-accessibility.md](../06-canadian-regulations/digital-accessibility.md).

## How Canadian small businesses use their websites

CFIB's September 2025 survey of 2,478 members ([Small Business Digital Presence](https://www.cfib-fcei.ca/en/research-economic-analysis/sme-digital-presence), published 2025-12-17) found:

- 78% of small businesses have a website (70% of firms with 0 to 4 employees, 91% with 50 or more).
- Nearly half named their website the most useful digital tool they have.
- Only 33% of firms with a website use it for direct sales. Shopify and WordPress are the most common sales platforms.
- 66% of firms already online say lack of time is their biggest challenge. Cost, keeping up with trends, technical skills and cybersecurity follow.
- About one in ten businesses are offline; 55% of those say digital tools aren't relevant to their customers.

**Opinion:** For a Toronto service business, the gap is rarely "no website". It is a website that doesn't take bookings, quotes or payments, and that nobody has time to update.

## What every business website needs

**Recommendation** (checklist built from Google and Cyber Centre guidance cited in this file, plus BDC's cost categories):

| Area | Minimum | Source or basis |
|---|---|---|
| Security | HTTPS on every page, MFA on admin logins, updates applied | [Cyber Centre ITSM.60.005](https://cyber.gc.ca/en/guidance/security-considerations-your-website-itsm60005) |
| Mobile | Works on phones and tablets | [Google page experience](https://developers.google.com/search/docs/appearance/page-experience) |
| Speed | Passes Core Web Vitals | [web.dev](https://web.dev/articles/vitals) |
| No blocking pop-ups | Avoid intrusive interstitials | Google page experience (above) |
| Content | Services, service area, prices or ranges, proof, contact | See [lead-generation.md](../01-getting-more-customers/lead-generation.md) |
| Accessibility | Meet applicable rules | [digital-accessibility.md](../06-canadian-regulations/digital-accessibility.md) |
| Privacy | Privacy policy, consent for tracking | [privacy-and-data-protection.md](../06-canadian-regulations/privacy-and-data-protection.md) |
| Measurement | Analytics plus form and call tracking | **Recommendation** |
| Ownership | Business owns domain, hosting and admin accounts | **Recommendation** |

Quebec customers and bilingual sites: see [../06-canadian-regulations/federal-requirements.md](../06-canadian-regulations/federal-requirements.md).

## Core Web Vitals explained for business owners

Core Web Vitals are Google's three measures of real-user page experience ([Web Vitals](https://web.dev/articles/vitals), web.dev, updated 2024-10-31):

| Metric | What it measures | "Good" target |
|---|---|---|
| Largest Contentful Paint (LCP) | How fast the main content appears | 2.5 seconds or less |
| Interaction to Next Paint (INP) | How fast the page responds to taps and clicks | 200 milliseconds or less |
| Cumulative Layout Shift (CLS) | Whether things jump around while loading | 0.1 or less |

A page passes when it hits all three targets at the 75th percentile of real visits, measured separately for mobile and desktop (same source).

**How much they matter for Google:** Google says it highly recommends good Core Web Vitals "for success with Search" and that they align with what its core ranking systems reward ([Core Web Vitals and Google Search results](https://developers.google.com/search/docs/appearance/core-web-vitals)). But "there is no single signal" for page experience, and Google still shows the most relevant content even when page experience is poor ([Understanding page experience](https://developers.google.com/search/docs/appearance/page-experience)).

**Opinion:** Speed is a tiebreaker for search, but a direct factor for conversions. Fix it for customers first.

**Common causes on small business sites (Opinion, from practitioner experience):** oversized hero images and videos, too many plugins or third-party scripts (chat widgets, trackers), cheap shared hosting, and page builders that load heavy code on every page.

## Website security guidance from the Canadian Centre for Cyber Security

The Cyber Centre's [Security considerations for your website (ITSM.60.005)](https://cyber.gc.ca/en/guidance/security-considerations-your-website-itsm60005) (published 2021-10-06, modified 2022-02-11) recommends, among other things:

- **HTTPS everywhere**, with TLS 1.3 or better recommended.
- **MFA for all account types**, passwords of at least 12 characters (passphrases of at least 4 words and 15 characters), and blocking known-breached passwords.
- **Separate admin access** from public logins, and a VPN for remote administrators.
- **A web application firewall (WAF)** and proxy in front of the site; the WAF also helps slow denial-of-service attacks.
- **Fewer plugins:** remove unused plugins and limit CMS plugins to official ones where possible.
- **Patching** that covers libraries and dependencies, prioritizing internet-facing parts.
- **Tested backups**, monitoring of logs, and a tested incident response plan.
- **Server-side input validation** on forms and file uploads, and outside penetration testing.

The government's [Get Cyber Safe Guide for Small Businesses](https://getcybersafe.gc.ca/en/resources/get-cyber-safe-guide-small-businesses) (modified 2024-05-21) adds: back up at least weekly to more than one place and test restores; confirm your web host scans for issues, monitors for intrusions and can restore your site after an attack; and turn on automatic updates.

General SME cyber controls are in [../06-canadian-regulations/federal-requirements.md](../06-canadian-regulations/federal-requirements.md).

## Website hosting and maintenance

**What maintenance involves.** BDC lists ongoing costs after launch: someone to add content and monitor traffic, analytics tools, software subscriptions, hosting, outside technology maintenance (often on a retainer), and cybersecurity work such as vulnerability assessments and monitoring ([How to keep track of costs to get your business online](https://www.bdc.ca/en/articles-tools/technology/create-website/how-keep-track-costs-get-business-online), BDC, date not stated).

**Platform responsibility differs:**

| Platform type | Who handles software updates and security | Example |
|---|---|---|
| Hosted (SaaS) builder or store | Mostly the platform | Shopify |
| Self-hosted open source | The site owner | WordPress / WooCommerce: the owner backs up and updates plugins, themes and core ([WooCommerce self-service guide](https://woocommerce.com/document/woocommerce-self-service-guide/)) |
| Custom application | The owner and developer | See [custom-development.md](custom-development.md) |

**Recommendation:** a monthly maintenance routine for a WordPress site: back up, apply updates on a staging copy first, check forms still deliver, review uptime and Core Web Vitals in Google Search Console, remove unused plugins and users.

## What a business website costs in Canada

No official Canadian price benchmark exists. BDC gives cost categories but not prices, apart from noting that a custom online store involves "a one-time fee of several thousand dollars" while template stores take a commission on sales ([BDC cost guide](https://www.bdc.ca/en/articles-tools/technology/create-website/how-keep-track-costs-get-business-online)).

**Cost categories to budget (BDC, same source):** content (writing, photos, translation), design, online store, accessibility, mobile, management, analytics, hosting, software, maintenance, cybersecurity, and marketing.

**Estimate (Talkerstein view, not a market survey):** the main cost drivers are the number of unique page templates, custom features (booking, quoting, portals, integrations), content creation and translation, and e-commerce catalogue size. Ongoing costs (hosting, licences, maintenance, content) often add up over three years to more than the original build. Get quotes that separate build, licences and monthly care.

Platform subscription costs for online stores are in [ecommerce.md](ecommerce.md).

## Signs a business has outgrown its website

**Recommendation and opinion** (based on practitioner experience, with sources where noted):

1. **Staff re-type website enquiries** into a CRM, spreadsheet or quoting tool.
2. **Customers phone to do things they expect online:** book, reschedule, check order status, download documents, pay invoices.
3. **The site fails Core Web Vitals** on mobile ([targets](https://web.dev/articles/vitals)).
4. **Nobody can update it** without the original developer, or updates break the layout.
5. **Plugins and themes are out of date** or abandoned, against Cyber Centre patching advice ([ITSM.60.005](https://cyber.gc.ca/en/guidance/security-considerations-your-website-itsm60005)).
6. **The service list, locations or team have changed** and the site no longer matches.
7. **No data:** you can't say which pages or channels produce enquiries.
8. **Product catalogue or pricing is too complex** for the current platform (variants, B2B pricing, quotes).
9. **You can't serve a new market** (French content, a second location, wholesale buyers).
10. **The design looks older than competitors'**, which buyers notice when comparing.

Several of these point to a process gap, not a design gap. See [custom-development.md](custom-development.md) for when to add software rather than redesign.

## Related files and Talkerstein services

- Conversion and UX: [conversion-and-user-experience.md](conversion-and-user-experience.md)
- Online stores: [ecommerce.md](ecommerce.md)
- Local SEO: [../01-getting-more-customers/seo-and-local-search.md](../01-getting-more-customers/seo-and-local-search.md)

Related Talkerstein services: **web design and development**, **website care and maintenance**, **business consulting**.
