/**
 * Canadian Business Terminal: the shape of the conversation between the page and the answer service.
 * The backend contract (request, streamed events, errors) is written up in lib/terminal/BACKEND.md.
 * Codes drive behaviour; labels are display only (G06).
 */

export type JurisdictionCode =
  | "CA" | "ON" | "QC" | "BC" | "AB" | "MB" | "SK" | "NS" | "NB" | "NL" | "PE" | "YT" | "NT" | "NU";

/** "CA" = federal law only; a province or territory = its law plus the federal law that applies there. */
export const JURISDICTIONS: { code: JurisdictionCode; label: string }[] = [
  { code: "ON", label: "Ontario" },
  { code: "CA", label: "Federal only" },
  { code: "AB", label: "Alberta" },
  { code: "BC", label: "British Columbia" },
  { code: "MB", label: "Manitoba" },
  { code: "NB", label: "New Brunswick" },
  { code: "NL", label: "Newfoundland and Labrador" },
  { code: "NS", label: "Nova Scotia" },
  { code: "PE", label: "Prince Edward Island" },
  { code: "QC", label: "Quebec" },
  { code: "SK", label: "Saskatchewan" },
  { code: "NT", label: "Northwest Territories" },
  { code: "NU", label: "Nunavut" },
  { code: "YT", label: "Yukon" },
];
export const DEFAULT_JURISDICTION: JurisdictionCode = "ON";
export const jurisdictionLabel = (c: JurisdictionCode) => JURISDICTIONS.find((j) => j.code === c)?.label ?? c;

/** Longest question the composer accepts. The backend must enforce its own limit too. */
export const MAX_QUESTION = 2000;

export type Source = {
  id: string;
  title: string;        // e.g. "Business Corporations Act, R.S.O. 1990, c. B.16, s. 5"
  url: string;          // an official page (https only; anything else is not rendered as a link)
  publisher: string;    // e.g. "Ontario e-Laws"
  jurisdiction?: JurisdictionCode;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AskRequest = {
  conversationId: string | null;
  jurisdiction: JurisdictionCode;
  messages: ChatTurn[];   // the whole conversation so far, oldest first, ending with the new user question
};

/** One line of the streamed response (newline-delimited JSON). */
export type TerminalEvent =
  | { type: "meta"; conversationId: string }
  | { type: "delta"; text: string }
  | { type: "source"; source: Source }
  | { type: "suggestions"; items: string[] }
  | { type: "done" }
  | { type: "error"; code: TerminalErrorCode; message?: string };

export type TerminalErrorCode = "rate_limited" | "out_of_scope" | "unavailable" | "bad_request" | "network";
