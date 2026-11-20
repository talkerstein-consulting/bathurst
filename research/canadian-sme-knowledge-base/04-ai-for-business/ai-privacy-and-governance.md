---
title: "AI Privacy, Governance and Canadian AI Law for SMEs"
pillar: "Using AI to Grow"
geography:
  - Canada
  - Ontario
  - Toronto
last_updated: "2026-11-12"
source_count: 11
document_type: "research"
---

# AI Privacy, Governance and Canadian AI Law for SMEs

This file covers how Canadian privacy law applies when a business uses AI, the Privacy Commissioner's guidance on generative AI, chatbot liability, the status of federal AI legislation as of November 12, 2026, and Ontario's public-sector AI law. General privacy obligations (consent, breach reporting, Quebec Law 25, PHIPA) are in [privacy-and-data-protection.md](../06-canadian-regulations/privacy-and-data-protection.md) and are not repeated here.

**This is general information, not legal advice.** Speak to a privacy lawyer before using AI with sensitive information or for decisions about individuals.

## No AI-specific federal law is in force (status at November 12, 2026)

| Date | Event | Source |
|---|---|---|
| June 2022 | Artificial Intelligence and Data Act (AIDA) introduced as part of Bill C-27 | [Schwartz Reisman Institute](https://srinstitute.utoronto.ca/news/whats-next-for-aida) |
| January 6, 2025 | Parliament prorogued; Bill C-27, including AIDA, died on the order paper | same |
| June 4, 2026 | National AI Strategy "AI for All" announced; pillar 1 commits to modernizing privacy and online safety laws | [ISED, June 5, 2026](https://www.canada.ca/en/innovation-science-economic-development/news/2026/06/minister-solomon-highlights-canadas-national-artificial-intelligence.html) |
| June 15, 2026 | Bill C-36, the *Protecting Privacy and Consumer Data Act* (PPCDA), tabled by the Minister of Artificial Intelligence and Digital Innovation | [ISED, June 2026](https://www.canada.ca/en/innovation-science-economic-development/news/2026/06/government-of-canada-tables-new-legislation-to-protect-childrens-data-strengthen-privacy-and-build-trust-in-the-digital-economy.html) |
| November 12, 2026 | LEGISinfo shows C-36 "at second reading" in the House of Commons with first reading (June 15, 2026) as the latest completed stage | [LEGISinfo C-36](https://www.parl.ca/legisinfo/en/bill/45-1/C-36) |

**What this means:** As of this date there is no federal statute regulating AI systems as such. Businesses using AI must follow existing law, chiefly PIPEDA for personal information in commercial activity, plus consumer protection, human rights, employment and negligence law. The government's C-36 announcement does not mention AIDA and describes no stand-alone AI rules beyond automated decision-making transparency ([ISED](https://www.canada.ca/en/innovation-science-economic-development/news/2026/06/government-of-canada-tables-new-legislation-to-protect-childrens-data-strengthen-privacy-and-build-trust-in-the-digital-economy.html)).

**Check again before relying on this:** bill status changes. Look up C-36 on [LEGISinfo](https://www.parl.ca/legisinfo/en/bill/45-1/C-36).

## What Bill C-36 would change for businesses using AI (if passed)

From the government's announcement ([ISED, June 2026](https://www.canada.ca/en/innovation-science-economic-development/news/2026/06/government-of-canada-tables-new-legislation-to-protect-childrens-data-strengthen-privacy-and-build-trust-in-the-digital-economy.html)):

- **Automated decision-making:** organizations would have to be transparent about automated decision-making used for significant decisions about individuals.
- **Deletion:** individuals could request deletion of their personal information.
- **Plain-language explanations** of data handling and meaningful consent.
- **Cross-border transfers:** safeguards and risk assessments before transferring personal information outside Canada. Relevant because many AI tools process data in the United States.
- **Children's information:** higher standards.
- **Regulator:** a new Digital Safety and Data Protection Commission of Canada with binding order powers.
- **Penalties:** up to $10 million or 3% of global revenue; up to $25 million or 5% for the most serious offences.

**This is a bill, not law.** Its content can change in Parliament. PIPEDA remains the federal private-sector law until any replacement is in force.

## How PIPEDA applies when you use AI tools

PIPEDA's 10 fair information principles are accountability, identifying purposes, consent, limiting collection, limiting use/disclosure/retention, accuracy, safeguards, openness, individual access and challenging compliance ([OPC](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/)). Applied to everyday AI use:

| Situation | What PIPEDA-based guidance expects |
|---|---|
| Staff paste customer details into a chatbot | The OPC says avoid entering personal information into prompts unless authorized ([OPC principles](https://www.priv.gc.ca/en/privacy-topics/technology/artificial-intelligence/gd_principles_ai/)); the Cyber Centre says the same for sensitive corporate data ([ITSAP.00.041](https://www.cyber.gc.ca/en/guidance/generative-artificial-intelligence-ai-itsap00041)) |
| An AI vendor processes your customer data | You remain responsible for personal information transferred to a third party for processing; assess the provider first ([OPC third-party guidance](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/gd_third-party_202609/)) |
| The vendor wants to train its models on your data | Assess whether consent is required and whether that purpose is consistent with PIPEDA ([OPC third-party guidance](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/gd_third-party_202609/)) |
| AI helps decide about a person (hiring, credit, eligibility) | Stay accountable, verify outputs, offer a way to challenge and request human review ([OPC principles](https://www.priv.gc.ca/en/privacy-topics/technology/artificial-intelligence/gd_principles_ai/)) |
| A customer asks what you hold about them | Access rights extend to personal information in prompts and outputs; keep records that make access meaningful (same source) |

## The OPC's principles for generative AI

The Office of the Privacy Commissioner of Canada published *Principles for Responsible, Trustworthy and Privacy-Protective Generative AI Technologies* on December 7, 2023 ([OPC](https://www.priv.gc.ca/en/privacy-topics/technology/artificial-intelligence/gd_principles_ai/)). The nine principles, with points most relevant to businesses **using** (not building) AI:

1. **Legal authority and consent** — consent must be meaningful; in sensitive contexts such as health care, consent may not be enough.
2. **Appropriate purposes** — "no-go zones" include deepfakes of identifiable people without consent, chatbots that nudge people into revealing sensitive information, and generating false or defamatory information about people.
3. **Necessity and proportionality** — show AI is needed and effective; use anonymized, synthetic or de-identified data where possible.
4. **Openness** — tell people when they are interacting with generative AI and when AI is used in decisions; label AI outputs that could significantly affect people.
5. **Accountability** — the organization stays responsible; have a complaints channel; consider privacy and algorithmic impact assessments; allow people to request human review.
6. **Individual access** — including information in prompts and outputs.
7. **Limiting collection, use and disclosure** — publicly available data still carries obligations; set retention limits.
8. **Accuracy** — verify outputs, especially those used in decisions about individuals.
9. **Safeguards** — guard against prompt injection, model inversion and jailbreaking.

## Lessons from Canadian AI enforcement and court decisions

- **OpenAI/ChatGPT joint investigation (May 6, 2026):** The federal, Quebec, BC and Alberta commissioners concluded OpenAI's initial training of ChatGPT did not comply with their privacy laws, citing over-collection, weak consent and transparency, inaccurate information about individuals and limits on access, correction and deletion. The federal complaint was found well-founded and conditionally resolved after OpenAI limited personal information in training ([OPC news release](https://www.priv.gc.ca/en/opc-news/news-and-announcements/2026/nr-c_260506/)).
- ***Moffatt v. Air Canada* (2024 BCCRT 149, February 14, 2024):** a BC tribunal held Air Canada liable for negligent misrepresentation by its website chatbot, ordered payment of $812.02 in total, and found the airline responsible for all information on its website whether from a static page or a chatbot ([Dentons](https://dww.com/articles/bc-tribunal-finds-air-canada-liable-for-inaccurate-advice-given-by-website-chatbot)).

**Takeaways for SMEs (Recommendation):** choose AI vendors that limit what personal data they collect and use for training; keep chatbot answers tied to current policies; correct errors quickly; tell customers when they're talking to AI.

## Ontario: Bill 194 applies to the public sector, not private businesses

- Ontario's *Strengthening Cyber Security and Building Trust in the Public Sector Act, 2024* (Bill 194) received Royal Assent and is S.O. 2024, c. 24 ([Legislative Assembly of Ontario](https://ola.org/en/legislative-business/bills/parliament-43/session-1/bill-194)).
- Schedule 1, the *Enhancing Digital Security and Trust Act, 2024*, sets AI requirements (public information about AI use, an accountability framework, risk management, human oversight in prescribed cases) for **public sector entities**: provincial and municipal institutions under FIPPA and MFIPPA, children's aid societies and school boards. Details depend on regulations ([OLA](https://ola.org/en/legislative-business/bills/parliament-43/session-1/bill-194)).
- **For a private Toronto business:** Bill 194 does not apply directly. It may matter indirectly if you sell AI-enabled services to a city, school board, hospital or ministry, which may pass requirements down in contracts (**Opinion**).
- **Unverified:** which sections are in force and which entities have been prescribed by regulation; check Ontario's e-Laws.

Ontario has no general private-sector privacy law; PIPEDA applies to most Ontario businesses. See [privacy-and-data-protection.md](../06-canadian-regulations/privacy-and-data-protection.md).

## A one-page AI use policy for a small business

**Recommendation** — a starting template, based on the OPC principles, the Cyber Centre's mitigations and the OPC third-party guidance cited above:

1. **Approved tools only.** List the AI tools staff may use, on business accounts with MFA. No personal accounts for work data.
2. **What never goes into AI:** health information, SINs, payment card data, passwords, client confidential files, employee records, unless a specific approved tool and purpose allow it.
3. **Human review.** A person checks every AI output before it goes to a customer, is published or is used in a decision about someone.
4. **Disclosure.** Customer-facing bots and voice agents say they are AI and offer a person.
5. **No-go uses.** No deepfakes, fake reviews or AI-generated claims about named people.
6. **Vendor check** before adoption: where data is stored, whether it trains models, retention and deletion, breach notice, exit terms ([OPC third-party guidance](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/gd_third-party_202609/)).
7. **Owner and log.** One named person owns each AI tool and automation; keep a simple register.
8. **Update privacy notice** to mention AI tools and any processing outside Canada.
9. **Report problems** — wrong answers, data pasted by mistake, suspicious AI-generated messages — to one contact.
10. **Review yearly**, and whenever the law changes (check C-36 status).

The Cyber Centre also recommends a cyber security risk plan that sets AI-use policies and oversight ([ITSAP.00.041](https://www.cyber.gc.ca/en/guidance/generative-artificial-intelligence-ai-itsap00041)).
