# Third-party marks used in the /check-2 headline

Other companies' logos. They are here because the headline names those companies, and a
name set as a word is weaker than the mark the reader already recognises. Nothing here
is redrawn, recoloured or rebuilt.

## In use on /check-2 (as of 2026-11-27) — all unmodified, each company's own colours

- **google-wordmark.png** — Google's colour wordmark, from
  `https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png`,
  trimmed to its ink. Headline pill and the proof row.
- **chatgpt-wordmark.svg** — the blossom + "ChatGPT" lockup chatgpt.com puts in its own
  header (https://chatgpt.com/overview/, 118x28). Paths untouched; its `currentColor` is
  set to black. Headline pill.
- **clutch-logo.svg** — Clutch's logotype exactly as clutch.co serves it in its header
  (dark slate + red dot). Proof row.
- **highlevel-logo.png** — HighLevel's Space Blue horizontal logo from its brand kit,
  https://marketing.gohighlevel.com/brandkit, trimmed and scaled to 1200px wide. Proof row.
- **../../logos-color/wordpress.svg** — not in this folder, but used by /check-2: the
  WordPress mark already in the repo, in WordPress's own #21759B, unmodified. It is the
  chip in the results score container that reports whether the site is built on
  WordPress. The WordPress mark is a WordPress Foundation trademark; its use here is
  nominative — naming the software a site runs on — and should be checked against
  https://wordpressfoundation.org/trademark-policy/ before this ships publicly.

None of these companies has approved this use. Anyone shipping this publicly should check
it against each company's brand terms first.

## Superseded (kept for reference, not used by the page)

## google-wordmark.png — the real one
Google's own full colour wordmark, taken from Google's asset host:
`https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png`
Trimmed to its ink (540x179). Not modified otherwise. Kept here as the untouched
original; the page does not use this file.

## google-wordmark-steel.png — the one the page uses, REPAINTED
The file above with its four colours replaced by one, Steel Blue (#19254A). The
letterforms, their spacing and the alpha carrying their edges are untouched.

**FLAGGED.** Google's brand terms do not permit recolouring the wordmark. This was a
deliberate design decision — the headline sets both companies in the page's own ink so
the line reads as a sentence rather than as a sentence with two logos dropped into it —
and it is the thing to revisit first if this page is ever shown publicly. Putting the
colour version back is a one-line change in components/tcg/instrument.tsx.

## chatgpt-mark.svg — ChatGPT's own mark, from ChatGPT
The mark chatgpt.com serves as its own icon:
`https://chatgpt.com/cdn/assets/favicon.6a33781f61.svg`
This is the current ChatGPT blossom, not the older OpenAI symbol that was here before.
The geometry is untouched; its stylesheet painted it black (white in a dark UI) and that
one rule is replaced with a fixed Steel Blue fill, to match the Google wordmark beside it.

**FLAGGED.** OpenAI publishes no downloadable ChatGPT *wordmark*. Checked:
  - chatgpt.com — this icon, and favicons
  - openai.com/brand — marketing imagery, and a partnership pack containing only
    Photoshop .psb templates
  - Wikimedia Commons — hosts the OpenAI symbol, no ChatGPT wordmark (it is non-free)

So the headline sets this mark beside the word "ChatGPT" in the page's own type. That
lockup is this project's, not OpenAI's. If the official one is obtained — through an
OpenAI partnership or brand contact — it should replace both pieces.

Neither company has approved this use. Anyone shipping this publicly should check it
against Google's and OpenAI's brand terms first.
