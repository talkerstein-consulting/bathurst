# Leyendecker — Higgsfield recipe

For J.C. Leyendecker (1874–1951): Arrow Collar Man, ~320 *Saturday Evening Post* covers.
Tuned to the TCG palette so the hero art sits inside the prototype's own colours.

- **Model:** `gpt_image_2_5` (painterly fidelity + clean edges). `nano_banana_flash` is the cheaper fallback; it goes softer and loses the stroke.
- **Params:** `--aspect_ratio 16:9 --resolution 2k` (hero plate is 1760×995).
- **Shape of a prompt:** `SUBJECT + STAGING` then the `STYLE BLOCK` verbatim, then the `EXCLUSIONS` line. Style last so it governs; subject first so it isn't diluted.

## What actually makes it read as Leyendecker

| Trait | Prompt wording that lands it |
|---|---|
| The stroke | "broad square-ended unblended parallel brushstrokes that follow the form, hatching left visible" — the single highest-signal phrase |
| Idealized figure | "confident, athletic, relaxed aristocratic poise, strong jawline, slight low camera angle so the figure reads heroic" |
| Skin | "luminous skin, cool blue-green shadow underpainting, warm ochre halftones" |
| Light | "hard-edged specular highlights, one strong rim light down a single edge" |
| Cloth | "drapery in large simple planes of light and shadow, crisp creases, no fussy detail" |
| Ground | "flat poster-like background, almost no detail, generous negative space" |
| Period | "golden-age American magazine cover illustration, c. 1915–1930, slight canvas tooth and offset print grain" |
| Palette | 2 colours + 1 accent. Never more. |

## Style block (paste verbatim)

```
Oil painting illustration in the style of J.C. Leyendecker, golden-age American
magazine cover art c. 1915-1930. Built from visible flat crosshatched brushwork:
broad, square-ended, unblended parallel strokes that follow the form, the hatching
left visible across skin, cloth and background. Idealized confident figure with a
strong jawline and relaxed aristocratic poise, seen from a slightly low angle so it
reads heroic. Crisp hard-edged specular highlights; drapery rendered in large simple
planes of light and shadow. Luminous skin with cool blue-green shadow underpainting
and warm ochre halftones. One strong rim light down a single edge of the figure.
Flat poster-like background, almost no detail, generous negative space. Strictly
limited palette: warm cream #F3F7F3 ground, deep navy #19254A for darks and clothing,
burnt orange #B3530E as the single accent. Thin dark contour lines where forms meet.
Slight canvas tooth and period offset-print grain.
```

## Exclusions (append; GPT Image 2.5 takes no negative flag)

```
Not photographic. No soft gradients, no airbrush, no lens blur, no bokeh, no HDR,
no modern digital rendering, no third accent colour, no text, lettering, logo,
signature or watermark.
```

## Hero staging rule

Measured off the live build, not guessed. The plate is a fixed **16:10** box. The intake
bar spans from 10% to **20.7%** down it, the "send us your trouble" tab sits above that,
and `.plate::after` lays a navy wash over the top 34%. So the whole upper third is spoken
for.

Generate at **16:9** anyway. `object-fit: cover` onto 16:10 crops the *sides* (~5% off
each edge) and leaves the vertical untouched — so the empty band you paint at the top
arrives on screen exactly where you put it. 3:2 is numerically closer to 16:10 but crops
top and bottom, which eats the band.

Carry this verbatim:

```
Composition rule, strictly obeyed: the upper two-fifths of the canvas is one unbroken
band of flat empty warm cream ground - no head, no object, no edge, no detail of any
kind enters it. The figure stands in the lower three-fifths only, placed to the left of
centre and facing into frame, the top of the head beginning below that empty band. Keep
all subject matter clear of the extreme left and right edges. Low-horizon poster
composition with a deep well of calm negative space across the whole top.
```

Two-fifths, not one-third: the wash reaches 34%, and a head grazing the underside of the
intake bar looks worse than one sitting clearly below it.

## Quality

`quality` defaults to **`low`** and is easy to miss — the first round shipped on it.
Tiers at 2k: low 0.5 credits, medium 1, high 2.75, **max 9**. A ten-plate hero set at max
is 90 credits. Pay it; `low` mushes the brushwork that the whole style depends on.

```
--resolution 2k --quality max
```

## The ten hero prompts

Order matches `#shots` in `components/Prototype.tsx` and `EXAMPLES` in `components/prototype-behaviour.ts`.

| # | File | Subject |
|---|---|---|
| 1 | electrical | Electrician, coil of cable over the shoulder, beside a service van |
| 2 | auto-service | Mechanic in coveralls under a raised car on a lift |
| 3 | restaurant | Restaurateur at the pass, plates going out behind |
| 4 | paperwork | Clerk at a desk stacked with intake forms, pen in hand |
| 5 | salon | Stylist with shears raised, mirror and chair behind |
| 6 | takeout | Counter cook handing a paper bag across the counter |
| 7 | events | Event planner with a clipboard under strung lights |
| 8 | clinic | Clinician at a reception desk, appointment book open |
| 9 | retail | Shopkeeper on the floor, stocked shelving behind |
| 10 | catering | Caterer carrying a loaded tray at shoulder height |

## Command

```bash
higgsfield generate create gpt_image_2_5 \
  --prompt "<subject + staging + style block + exclusions>" \
  --aspect_ratio 16:9 --resolution 2k --quality max --wait
```

## Tuning notes

- Flat and dead → add "sculptural volume, strong chiaroscuro, deep navy shadow shapes".
- Too photographic → push the stroke phrase to the **front** of the style block and add "thick impasto, palette-knife edges".
- Palette drifting → repeat the three hexes once more at the end of the prompt.
- Faces going generic-AI → add "period American magazine cover face, 1920s grooming".

## Wardrobe clause (required)

Leyendecker's idealized anatomy plus workwear (coveralls, aprons, rolled sleeves)
trips Higgsfield's output moderation — five of the first ten came back `status "nsfw"`,
and the same five failed again on a reword. They only passed once this sentence was
added between the subject and the staging line:

```
The figure is fully clothed in modest professional workwear: a long-sleeved collared
shirt buttoned to the neck, sleeves down to the wrist, trousers, arms and torso
completely covered.
```

Carry it in every prompt. Also drop "strong jawline" and "luminous skin / warm ochre
halftones" from the style block when a subject keeps failing — the figure then reads
as clothed form rather than body.

## The band has to be padded, not prompted

The staging rule above is still worth sending — it pushes the figure down and keeps the
right side open — but **the model will not give you two-fifths.** Measured across round
two: 0%, 9.7%, 10.5%, 11.3%, 12.9%, 14.5%, 16.6%, 20.5%. Asked for 40%, best effort 20%.
The intake ends at 20.7%, so prompting alone leaves heads clipped.

So the band is finished deterministically by `tools/plate-hero.py`:

```bash
python tools/plate-hero.py <dir-of-16:9-pngs> public/photos/leyendecker
```

It scans down from the top for the first row that departs from the flat cream, then
extends that cream until content starts at 28% of the final frame, trims the bottom back
to 16:10 and writes webp at 1760×1100. It **stretches the render's own top band** rather
than filling with a sampled colour — a flat fill leaves a visible tone seam against the
painted canvas tooth.

Output is a true 16:10, so `object-fit: cover` crops nothing and the composition arrives
intact.

## Moderation is stochastic — budget for retries

`status "nsfw"` is an output-side classifier, and it fires on different subjects each run:
round one failed electrical/auto-service/paperwork/salon/events, round two failed
electrical/restaurant/salon/takeout. It gets *worse* at higher quality — the three
hold-outs had all passed at `low`. What eventually cleared them:

1. the wardrobe clause, strengthened to "heavy double-breasted jacket buttoned to the
   throat, long sleeves to the wrist, no skin showing below the collar";
2. dropping "strong jawline", "luminous skin" and "warm ochre halftones";
3. stepping `max` down to `high`;
4. wider framing — figure smaller, three-quarter or seen from behind;
5. plain repetition. It is random enough that the same prompt passes on a later run.

Aprons, tunics and rolled sleeves are the worst offenders. Dress every trade in a
buttoned jacket from the start and most of this goes away.
