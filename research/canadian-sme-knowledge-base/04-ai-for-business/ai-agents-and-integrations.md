---
title: "AI Agents, Integrations and the Model Context Protocol (MCP) for SMEs"
pillar: "Using AI to Grow"
geography:
  - Canada
  - Ontario
  - Toronto
last_updated: "2026-11-12"
source_count: 10
document_type: "research"
---

# AI Agents, Integrations and the Model Context Protocol (MCP) for SMEs

This file explains AI agents, how AI connects to software a business already uses (email, calendar, CRM, accounting, files), what the Model Context Protocol (MCP) is, and the security points an owner should check. Use cases are in [practical-ai-applications.md](practical-ai-applications.md); costs and ROI in [ai-automation.md](ai-automation.md).

Statements with links are verified facts. **Recommendation** and **Opinion** labels mark advice.

## What an AI agent is, in business terms

An **AI assistant** answers when asked. An **AI agent** is given a goal and access to tools, and decides which steps to take: look up a customer in the CRM, check the calendar, draft a reply, book the job, log a note.

Examples relevant to Canadian SMEs:
- AI voice agents that answer calls for home-service contractors, book appointments in the CRM and follow up by text, email or phone; BDC profiled Winnipeg's OutreachGenius doing this ([BDC, July 13, 2026](https://www.bdc.ca/en/articles-tools/technology/artificial-intelligence/outreachgenius-using-ai-to-capture-missed-revenue-opportunities)).
- Office suites now include agent builders; Google lists "Studio for building AI-powered workflows across Workspace apps" in Business Standard ([Google Workspace AI](https://workspace.google.com/intl/en_ca/solutions/ai/)).

Statistics Canada does not measure "agents" separately; "decision-making systems" rose from 5.7% to 13.7% of AI-using businesses between Q2 2025 and Q2 2026 ([StatCan](https://www150.statcan.gc.ca/n1/pub/11-621-m/11-621-m2026010-eng.htm)).

**Opinion:** For an SME, an agent is worth it when it removes a hand-off that currently drops leads or delays work, and when its actions are limited and logged.

## Ways to connect AI to existing business software

| Approach | How it works | Good for | Watch for |
|---|---|---|---|
| Built-in AI in the tool | AI features inside the CRM, office suite or help desk | Fast start, data stays in one vendor | Limited to that vendor's data; usage fees |
| Integration platforms | No-code tools pass data between apps with an AI step in the middle | Linking 2 to 5 apps without developers | Many small connections to maintain; credentials stored in the platform |
| Direct API integration | Developers connect the AI model to each system's API | Custom workflows, high volume | Build and maintenance cost |
| MCP servers | A standard connector lets compatible AI apps use a system's data and actions | Reusing one connector across several AI tools | Server trust and permissions (see below) |

BDC lists connecting systems through integrations or APIs, centralizing data, or modernizing legacy software as the main ways to fix data access for AI, and suggests starting with the data one use case needs ([BDC, July 23, 2026](https://www.bdc.ca/en/articles-tools/technology/artificial-intelligence/how-to-prepare-your-company-data-for-ai)).

## What the Model Context Protocol (MCP) is

From the official documentation ([What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro)):

- MCP "is an open-source standard for connecting AI applications to external systems", such as data sources (files, databases), tools (search, calculators) and workflows (prompts).
- The docs compare it to "a USB-C port for AI applications": one standard connection instead of a custom one per pair of tools.
- It is supported by AI assistants including Claude and ChatGPT and developer tools such as Visual Studio Code and Cursor.
- Example uses given: an agent accessing Google Calendar and Notion; enterprise chatbots connecting to several databases so staff can analyze data in chat.

**What it means for an SME (Opinion):** If a business's CRM, accounting or project tool offers an MCP server, an MCP-compatible AI assistant can read and act in it without a custom integration, and the same connector works if the business switches AI assistant.

## How MCP works: hosts, clients, servers and primitives

From the [MCP architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture.md) (protocol version 2026-07-28):

- **Host:** the AI application (for example Claude Desktop or Visual Studio Code).
- **Client:** a connection the host creates for each server.
- **Server:** a program that provides context and actions. It can run **locally** (stdio transport, on the same computer) or **remotely** (Streamable HTTP; MCP recommends OAuth for authentication).
- **Server primitives:**
  - **Tools** — actions the AI can call (API calls, database queries, file operations).
  - **Resources** — data the AI can read (file contents, records).
  - **Prompts** — reusable templates.
- **Client primitive — Elicitation:** a server can ask the user for more information or confirmation of an action. Sampling and logging are deprecated as of 2026-07-28.
- MCP is stateless per request, and servers can notify clients when their tool list changes.

**Example in a business:** an accounting system's MCP server might expose a resource (the chart of accounts), a tool (create a draft invoice) and a prompt (month-end summary). The AI lists the tools, calls the one it needs, and the result comes back into the conversation.

## MCP and agent security risks owners should know

The official [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices.md) describe these risks, among others:

| Risk | Plain-language meaning |
|---|---|
| Local MCP server compromise | Local servers are programs run on your computer with the AI app's privileges; a malicious one can run commands or steal files. Clients must show the exact command and get approval before installing one. |
| Token passthrough | A server must not accept access tokens that weren't issued to it; doing so breaks audit trails and controls. |
| Confused deputy | A poorly built proxy server can let an attacker obtain access to a third-party account without the user's consent. |
| Server-side request forgery | A malicious server can trick a client into contacting internal systems or cloud metadata endpoints. |
| Over-broad scopes | Tokens with wide permissions (all files, admin) magnify the damage if stolen; start with minimal scopes. |

The Canadian Centre for Cyber Security lists prompt-related privacy leaks, malicious code, poisoned datasets and phishing among generative AI risks, and advises vetting AI vendors' security practices ([ITSAP.00.041](https://www.cyber.gc.ca/en/guidance/generative-artificial-intelligence-ai-itsap00041)). The OPC asks organizations to guard against prompt injection and jailbreaking ([OPC principles](https://www.priv.gc.ca/en/privacy-topics/technology/artificial-intelligence/gd_principles_ai/)).

## A safe rollout checklist for agents and integrations

**Recommendations:**

1. **Start read-only.** Give the agent access to look up data before allowing it to create, send, pay or delete.
2. **Least privilege.** Use a dedicated account or API key with only the scopes needed; never connect an owner/admin login.
3. **Approve risky actions.** Require a person to confirm sending external messages, issuing refunds, changing prices or deleting records.
4. **Only install connectors from sources you trust**, and review the exact command a local MCP server runs ([MCP security](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices.md)).
5. **Separate sensitive data.** Keep HR, health and payment data out of general assistants' reach.
6. **Log and review.** Keep a record of what the agent did and check it weekly at first.
7. **Use MFA and patch promptly**, as the Cyber Centre advises ([ITSAP.00.041](https://www.cyber.gc.ca/en/guidance/generative-artificial-intelligence-ai-itsap00041)).
8. **Assess the vendor** using the OPC's third-party checklist, including where data is stored and whether it is used to train models ([OPC third-party guidance](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/gd_third-party_202609/)). See [ai-privacy-and-governance.md](ai-privacy-and-governance.md).
9. **Plan the exit.** Check data portability and what happens to your data when the contract ends ([OPC third-party guidance](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/gd_third-party_202609/)).
