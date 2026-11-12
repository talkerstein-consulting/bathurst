---
title: "Custom Development vs Existing Software for Canadian SMEs: Web Apps, Portals and Integrations"
pillar: "Improving Digital Presence"
geography:
  - Canada
  - Ontario
  - Toronto
last_updated: "2026-11-12"
source_count: 5
document_type: "research"
---

# Custom Development vs Existing Software for Canadian SMEs: Web Apps, Portals and Integrations

This file covers when existing software (website builders, Shopify, WooCommerce, booking and CRM tools) is enough, when custom development pays off, what custom web applications and portals involve, and how to manage the risk. Most of this file is **Recommendation** or **Opinion** from practitioner experience, because no Canadian official source measures build-vs-buy outcomes for SMEs. Facts are linked.

## When existing software is enough

**Recommendation:** use off-the-shelf software when:

- The process is common across many businesses (appointment booking, invoicing, standard online store, email marketing).
- You can change your process slightly to fit the tool without losing an advantage.
- Total subscription cost over three years is lower than building and maintaining an equivalent.
- The vendor handles security and updates you don't have the staff for. For example, hosted platforms like Shopify take on hosting and core updates, whereas self-hosted WooCommerce leaves backups and updates to the owner ([WooCommerce self-service guide](https://woocommerce.com/document/woocommerce-self-service-guide/)).

CFIB found 66% of small businesses online say lack of time is their main digital barrier, with limited technical skills also cited ([CFIB, 2025](https://www.cfib-fcei.ca/en/research-economic-analysis/sme-digital-presence)). **Opinion:** this favours existing software for most SMEs most of the time.

## When a business needs custom development

**Recommendation:** consider custom development when one or more of these is true:

1. **The process is your competitive edge** (a unique quoting method, configurator or service model) and off-the-shelf tools would flatten it.
2. **Staff glue systems together by hand:** re-typing orders from the website into accounting or ERP, copying leads into a CRM. A custom integration may be the cheapest fix.
3. **You pay for several tools to do one job,** each partly.
4. **Customers need a tailored login:** B2B pricing, project documents, multi-site accounts.
5. **Per-user or per-transaction fees grow faster than revenue.**
6. **Data or compliance needs** (for example, where data is stored or who can see it) aren't met by available tools. See [../06-canadian-regulations/privacy-and-data-protection.md](../06-canadian-regulations/privacy-and-data-protection.md).

**Opinion:** the best first step is usually a small custom layer on top of existing software (an integration, a portal, a calculator), not replacing everything.

## Custom vs existing software compared

| Factor | Existing software (SaaS or plugins) | Custom development |
|---|---|---|
| Upfront cost | Low | High; BDC notes custom online stores involve "a one-time fee of several thousand dollars" ([BDC](https://www.bdc.ca/en/articles-tools/technology/create-website/how-keep-track-costs-get-business-online)) |
| Ongoing cost | Subscriptions, often per user or per sale | Hosting, maintenance, security, changes |
| Time to launch | Days to weeks | Weeks to months (**Estimate**) |
| Fit to process | You adapt to the tool | Tool adapts to you |
| Security and updates | Largely vendor (hosted) | Owner and developer |
| Vendor risk | Price changes, feature removal | Developer dependency |
| Data ownership | Per vendor terms | Owned, if the contract says so |

## Custom web applications and customer portals for SMEs

**Common SME examples (Opinion, practitioner experience):**

- **Contractors and trades:** online quote builder, project portal with photos, change orders and invoices.
- **Manufacturers and distributors:** B2B ordering portal with customer pricing, reorders and spec sheets.
- **Clinics and professional services:** intake forms and secure document exchange, often integrated with an existing practice system rather than replacing it.
- **Architecture and engineering:** project status and file sharing for clients.
- **Retail:** product configurator feeding Shopify or WooCommerce.

**Security baseline for anything with logins** ([Cyber Centre ITSM.60.005](https://cyber.gc.ca/en/guidance/security-considerations-your-website-itsm60005)): MFA, strong password policy, secure sessions with timeouts, server-side input validation, least-privilege access, patching of dependencies, monitoring and outside penetration testing.

## Managing the risk of a custom build

**Recommendation:**

- **Write down the process first,** with the steps, people and data involved, before choosing technology.
- **Start with the smallest version** that removes the biggest manual task, then extend.
- **Own the code, accounts and data.** The contract should give the business the source code, hosting accounts, domain and documentation.
- **Budget for maintenance** every year: dependencies need patching, as the Cyber Centre recommends ([ITSM.60.005](https://cyber.gc.ca/en/guidance/security-considerations-your-website-itsm60005)).
- **Prefer integrations over rebuilds:** connect to the accounting, CRM or POS you already use.
- **Plan for accessibility** from the start; see [../06-canadian-regulations/digital-accessibility.md](../06-canadian-regulations/digital-accessibility.md).
- **Check performance:** custom front ends must still meet Core Web Vitals targets ([web.dev](https://web.dev/articles/vitals)).

## Related files and Talkerstein services

- Website requirements and signs you've outgrown your site: [business-websites.md](business-websites.md)
- Store platforms: [ecommerce.md](ecommerce.md)
- Automation and CRM: [../02-business-efficiency/](../02-business-efficiency/)
- AI integrations: [../04-ai-for-business/](../04-ai-for-business/)

Related Talkerstein services: **custom development**, **integrations and automation**, **business consulting** (build-vs-buy assessment).
