import { expect, test } from "@playwright/test";

test("suggestions preserve a draft and support a sourced conversation with follow-ups", async ({ page }) => {
  const requests: {role: string; content: string}[][] = [];
  await page.route("**/api/chatbot", async route => {
    requests.push(route.request().postDataJSON().messages);
    await route.fulfill({ json: {answer: "Fringe Boutique paired Shopify with point of sale.",
      sources: [{title: "Fringe Boutique", url: "https://talkerstein.com/work/fringe-boutique"}], followups: ["Which system holds the inventory?"]} });
  });
  await page.goto("/chatbot");
  const input = page.getByRole("combobox");
  await input.fill("inventory");
  await expect(page.getByRole("option").first()).toContainText("stock");
  await input.press("Escape");
  await expect(input).toHaveValue("inventory");
  await expect(page.getByRole("listbox")).toBeHidden();
  await input.press("ArrowDown");
  await input.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", {name: /Fringe Boutique/})).toHaveAttribute("href", "https://talkerstein.com/work/fringe-boutique");
  const reply = dialog.getByRole("textbox", {name: "Ask a question"});
  const followup = "Which system holds the inventory?";
  await expect(reply).toHaveAttribute("placeholder", followup);
  await expect(reply).toHaveValue("");
  await expect(dialog.getByText("Based on Talkerstein’s published work")).toHaveCount(0);
  await expect(dialog.getByRole("link", {name: "Talk to a person"})).toHaveCount(0);
  await dialog.getByRole("button", {name: "Send suggested question"}).click();
  await expect(dialog.locator(".msg-a")).toHaveCount(2);
  expect(requests[0][0].content).toMatch(/stock/);
  expect(requests[1].map(message => message.role)).toEqual(["user","assistant","user"]);
  expect(requests[1].at(-1)?.content).toBe(followup);
  await expect(reply).toHaveAttribute("placeholder", "Ask a question…");
  await reply.fill("Can you show me the Shopify project?");
  await reply.press("Enter");
  await expect(dialog.locator(".msg-a")).toHaveCount(3);
  expect(requests[2].at(-1)?.content).toBe("Can you show me the Shopify project?");
  await page.getByRole("dialog", {name:"Ask Talkerstein"}).getByRole("button", {name:"Menu", exact:true}).click();
  await page.getByRole("dialog", {name:"Chat menu"}).getByRole("button", {name:"Close conversation"}).click();
  await expect(dialog).toBeHidden();
});

test("the scrolled composer preserves the draft and sends from the bottom of the viewport", async ({page}) => {
  await page.route("**/api/chatbot", route => route.fulfill({json:{answer:"A response from the test.",sources:[],followups:[]}}));
  await page.goto("/chatbot");
  const input = page.getByRole("combobox");
  await input.fill("Which ads");
  await page.locator(".vis.bare").scrollIntoViewIfNeeded();
  const dock = page.locator('.agency-composer[data-docked="true"]');
  await expect(dock).toBeInViewport();
  await expect(input).toHaveValue("Which ads");
  const bounds = await dock.boundingBox();
  const gap = page.viewportSize()!.height - bounds!.y - bounds!.height;
  expect(gap).toBeGreaterThanOrEqual(12);
  expect(gap).toBeLessThan(36);
  await input.fill("");
  await input.click();
  const options = await page.getByRole("listbox").boundingBox();
  expect(options!.y + options!.height).toBeLessThan(bounds!.y);
  await input.fill("Which ads bring customers?");
  await dock.getByRole("button", {name:"Send question"}).click();
  await expect(page.getByText("A response from the test.")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog", {name:"Ask Talkerstein"}).getByRole("button", {name:"Menu", exact:true}).click();
  await page.getByRole("dialog", {name:"Chat menu"}).getByRole("button", {name:"Close conversation"}).click();
  await page.getByRole("banner").getByRole("button", {name:"Menu", exact:true}).click();
  await expect(page.getByRole("navigation", {name:"Main navigation"}).getByText("Book a call")).toHaveAttribute("href", "/book");
});

test("failed answers retry the original question once", async ({page}) => {
  let calls = 0;
  await page.route("**/api/chatbot", route => ++calls === 1
    ? route.fulfill({status:503, json:{error:"Please try again."}})
    : route.fulfill({json:{answer:"Recovered answer",sources:[],followups:[]}}));
  await page.goto("/chatbot");
  await page.getByRole("combobox").fill("How does booking work?");
  await page.getByRole("combobox").press("Enter");
  await page.getByRole("button", {name:"Retry"}).click();
  await expect(page.getByText("Recovered answer")).toBeVisible();
  await expect(page.locator(".msg-u")).toHaveCount(1);
});

test("narrow screen keeps the menu and composer actions inside the viewport", async ({page}) => {
  await page.setViewportSize({width:320,height:640});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/chatbot");
  await expect(page.getByRole("button",{name:"Play examples"})).toBeVisible();
  await page.getByRole("button",{name:"Next example"}).click();
  await expect(page.locator(".rotor .count")).toHaveText("2 / 10");
  await page.locator(".vis.bare").scrollIntoViewIfNeeded();
  await page.locator('.agency-composer[data-docked="true"]').waitFor();
  const menu = await page.getByRole("banner").getByRole("button", {name:"Menu", exact:true}).boundingBox();
  expect(menu!.x + menu!.width).toBeLessThanOrEqual(320);
});

test("stopping discards an unfinished answer and preserves the question", async ({page}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(done => {release = done;});
  await page.route("**/api/chatbot", async route => {
    await gate;
    await route.fulfill({json:{answer:"Obsolete answer",sources:[],followups:[]}}).catch(() => {});
  });
  await page.goto("/chatbot");
  await page.getByRole("combobox").fill("Tell me about branding.");
  await page.getByRole("combobox").press("Enter");
  try {
    await page.getByRole("button",{name:"Stop answer"}).click();
    await expect(page.getByText("Answer stopped.", {exact:false})).toBeVisible();
    await expect(page.locator(".msg-u")).toHaveText("Tell me about branding.");
  } finally {release();}
  await expect(page.locator(".msg-a")).toHaveCount(0);
});

test("the project map loads on demand and closes", async ({page}) => {
  await page.goto("/chatbot");
  await expect(page.locator(".mapplate iframe")).toHaveCount(0);
  await page.getByRole("button",{name:/Explore the client map/}).click();
  await expect(page.locator(".mapplate iframe")).toHaveAttribute("src","/map");
  const frame = page.frameLocator(".mapplate iframe");
  const zoom = frame.getByRole("button", {name: "Zoom in", exact: true});
  await expect(frame.locator("#stick")).toHaveClass(/mapready/, {timeout: 25000});
  await page.locator(".mapplate iframe").scrollIntoViewIfNeeded();
  await expect(zoom).toBeInViewport();
  const filters = frame.getByRole("group", {name:"Filter by industry"});
  expect(await filters.evaluate(el => {
    el.scrollBy(60, 60);
    return [el.scrollLeft, el.scrollTop];
  })).toEqual([0, 0]);
  const box = await page.locator(".mapplate iframe").boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const pin = frame.getByLabel("Yorkville Jewish Centre, 94 Avenue Rd, Toronto", {exact: true}).locator(".ic");
  await expect(pin).toHaveCSS("opacity", "1");
  await pin.click();
  await expect(frame.locator("#sheetBody")).toContainText("Yorkville Jewish Centre");
  await expect(frame.locator("#sheetBody")).toContainText("94 Avenue");
  await page.getByRole("button",{name:"Close map"}).click();
  await expect(page.locator(".mapplate iframe")).toHaveCount(0);
});

test("the API rejects malformed conversations before a model call", async ({request}) => {
  const response = await request.post("/api/chatbot",{data:{messages:[{role:"assistant",content:"Incomplete conversation"}]}});
  expect(response.status()).toBe(400);
  const tooLong = await request.post("/api/chatbot",{data:{messages:[{role:"user",content:"a".repeat(2001)}]}});
  expect(tooLong.status()).toBe(400);
});
test("the design preview opens a sample conversation and answers entirely in the browser", async ({page}) => {
  const apiCalls: string[] = [];
  await page.route(/\/api\/chatbot(?:\?|$)|api\.openai\.com/, route => {
    apiCalls.push(route.request().url());
    return route.abort();
  });
  await page.goto("/chatbot/preview");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", {name:/Fringe Boutique/})).toBeVisible();
  await dialog.getByRole("button", {name:"Send suggested question"}).click();
  await expect(dialog.locator(".ask-answer").last()).toContainText("one product");
  await page.getByRole("dialog", {name:"Ask Talkerstein"}).getByRole("button", {name:"Menu", exact:true}).click();
  const menu = page.getByRole("dialog", {name:"Chat menu"});
  await expect(menu.getByRole("link", {name:"Terms"})).toHaveAttribute("href", "https://talkerstein.com/terms-of-use");
  await expect(menu.getByRole("link", {name:"Contact"})).toHaveAttribute("href", "https://talkerstein.com/contact");
  await expect(menu.getByRole("link", {name:"FAQ"})).toHaveAttribute("href", "https://talkerstein.com/#faq");
  await menu.getByRole("button", {name:"Close menu"}).click();
  await expect(menu).toBeHidden();
  const input = dialog.getByRole("textbox");
  await input.fill("Which ads brought us leads?");
  await input.press("Enter");
  await expect(dialog.locator(".ask-answer").last()).toContainText("cost per qualified lead");
  expect(apiCalls).toEqual([]);
});

test("ratings stay per answer, Menu restores the draft, and the fourth preview reply offers booking", async ({page}) => {
  await page.goto("/chatbot/preview");
  const chat = page.getByRole("dialog", {name:"Ask Talkerstein"});
  const first = chat.getByRole("article").first();
  const up = first.getByRole("button", {name:"Helpful", exact:true});
  const down = first.getByRole("button", {name:"Not helpful", exact:true});
  await up.click();
  await expect(up).toHaveAttribute("aria-pressed","true");
  await down.click();
  await expect(up).toHaveAttribute("aria-pressed","false");
  await down.click();
  await expect(down).toHaveAttribute("aria-pressed","false");
  const composer = chat.getByRole("textbox");
  await composer.fill("How can I compare ads?");
  const trigger = chat.getByRole("button", {name:"Menu"});
  await trigger.click();
  const menu = page.getByRole("dialog", {name:"Chat menu"});
  await expect(menu.getByRole("button",{name:"Close menu"})).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(composer).toHaveValue("How can I compare ads?");
  const measurements = await page.locator(".chat-foot").evaluate(el => ({
    gap: innerHeight - el.querySelector("form")!.getBoundingClientRect().bottom,
    divider: getComputedStyle(el).borderTopWidth
  }));
  expect(measurements.gap).toBeGreaterThanOrEqual(24);
  expect(measurements.divider).toBe("0px");
  for (const [index, question] of ["How can I compare ads?", "What about stock?", "How do we follow up on quotes?"].entries()) {
    await composer.fill(question);
    await composer.press("Enter");
    await expect(chat.getByRole("article")).toHaveCount(index + 2);
  }
  await chat.getByRole("article").last().locator(".answer-bubble").getByRole("button", {name:"Book a free 30-minute call"}).click();
  const booking = page.getByRole("dialog", {name:"Book a call"});
  const notes = booking.getByLabel("Meeting notes for Rishon");
  await expect(notes).toHaveValue(/Fringe Boutique.*ad quality.*stock.*quote/);
  await notes.fill("Review one quote handoff.");
  await booking.getByRole("button", {name:"Choose a time"}).click();
  await expect(booking.getByRole("status")).toContainText("live chat");
});

test("live booking passes only the reviewed notes to Rishon’s scheduler", async ({page,context}) => {
  await page.route("**/api/chatbot", r => r.fulfill({json:{answer:"We can review the quote together.", sources:[], followups:[], meetingBrief:"Review quote follow-up.", invite:true}}));
  await context.route("https://calendly.com/**", r => r.fulfill({body:"Mock scheduler"}));
  await page.goto("/chatbot");
  await page.getByRole("combobox").fill("Can I book a call?");
  await page.getByRole("combobox").press("Enter");
  await page.getByRole("button", {name:"Book a free 30-minute call"}).click();
  await page.getByLabel("Meeting notes for Rishon").fill("Trace one quote.");
  const [calendar] = await Promise.all([context.waitForEvent("page"),page.getByRole("button",{name:"Choose a time"}).click()]);
  await calendar.waitForLoadState();
  const url = new URL(calendar.url());
  expect(url.origin + url.pathname).toBe("https://calendly.com/hi-talkerstein/30min");
  expect([...url.searchParams.entries()]).toEqual([["a1","Trace one quote."]]);
});

test("reuses answered questions across rewording and reload, while changed evidence gets a new answer", async ({page}) => {
  let calls = 0;
  await page.route("**/api/chatbot", route => {
    calls++;
    return route.fulfill({json:{answer:"Compare the qualified rate.", sources:[], followups:[],
      paraphrases:["How do I attribute sales-ready prospects to their ads?"]}});
  });
  const original = "How can I tell which ads bring in qualified leads?";
  await page.goto("/chatbot");
  await page.getByRole("combobox").fill(original);
  await page.getByRole("combobox").press("Enter");
  await expect(page.locator(".ask-answer")).toHaveCount(1);
  await page.reload();
  await page.getByRole("combobox").fill(original);
  await page.getByRole("combobox").press("Enter");
  const reply = page.getByRole("textbox",{name:"Ask a question"});
  for (const q of ["Which advertisements generate quality leads?", "How do I attribute sales-ready prospects to their ads?"]) {
    await reply.fill(q);
    await reply.press("Enter");
    await expect(page.getByRole("button",{name:"View earlier answer"})).toBeVisible();
    await expect(page.locator(".ask-answer")).toHaveCount(1);
  }
  expect(calls).toBe(1);
  await reply.fill("Ad A had 40 leads, 8 qualified. What is its qualification rate?");
  await reply.press("Enter");
  await expect(page.locator(".ask-answer")).toHaveCount(2);
  expect(calls).toBe(2);
});

test("the API returns the prior answer for a paraphrase before invoking the model", async ({request}) => {
  const response = await request.post("/api/chatbot", {data:{messages:[
    {role:"user",content:"How can I tell which ads bring in qualified leads?"},
    {role:"assistant",content:"Compare qualified leads across your ads."},
    {role:"user",content:"Which advertisements generate high-quality leads?"}
  ]}});
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({reusedIndex:1,answer:"Compare qualified leads across your ads."});
});

test("overlapping deliveries share one model call, and a failed delivery can retry", async () => {
  const {POST} = await import("../app/api/chatbot/route");
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "local-test";
  let calls = 0;
  let shouldFail = false;
  const session = crypto.randomUUID();
  const submit = (content: string) => POST(new Request("http://localhost/api/chatbot", {
    method:"POST", headers:{"Content-Type":"application/json","X-Chat-Session":session},
    body:JSON.stringify({messages:[{role:"user",content}]})
  }));
  globalThis.fetch = async () => {
    calls++;
    if (shouldFail) throw new Error("Offline test failure");
    return Response.json({status:"completed", output:[{content:[{type:"output_text", text:JSON.stringify({
      answer:"Group by originating ad.", sources:[], followups:[], paraphrases:[],
      meetingBrief:"Compare ad quality.", bookingIntent:"continue", evidenceRequest:"Can you share the two counts?"
    })}]}]});
  };
  try {
    const q = "Which ads deliver qualified leads for my catering shop?";
    const starter = await (await submit("How can I tell which ads bring in qualified leads?")).json();
    expect(starter.answer).toContain("total leads and qualified leads for two ads");
    expect(calls).toBe(0);
    const results = await Promise.all([submit(q), submit(q), submit(q)]);
    for (const result of results) {
      expect(result.status).toBe(200);
      expect((await result.json()).answer).toBe("Group by originating ad.\n\nCan you share the two counts?");
    }
    expect(calls).toBe(1);
    shouldFail = true;
    expect((await submit("What about automation?")).status).toBe(503);
    shouldFail = false;
    expect((await submit("What about automation?")).status).toBe(200);
    expect(calls).toBe(3);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("landing motion keeps a static illustration and visible project work with reduced motion", async ({page}) => {
  await page.emulateMedia({reducedMotion: "reduce"});
  await page.goto("/chatbot");
  await expect(page.locator(".street-live")).toBeHidden();
  await expect(page.locator(".sx-reel").first()).toHaveCSS("animation-name", "none");
  const gallery = page.locator(".sphere-main");
  await gallery.scrollIntoViewIfNeeded();
  expect((await gallery.boundingBox())!.height).toBeGreaterThan(200);
  await expect.poll(() => gallery.locator(".dome-item img").evaluateAll(images => images.some(image => (image as HTMLImageElement).naturalWidth > 0))).toBeTruthy();
});

test("operational questions retrieve the right practice notes without private links", async () => {
  const {selectPracticeNotes} = await import("../lib/chatbot/sources");
  const cases = [
    ["Why do repeat form submissions wipe earlier answers in my CRM?", "Website form leads"],
    ["Our leads still get automated texts after they already booked", "Follow-up sequences"],
    ["How should we send Google reviews after a QuickBooks invoice is paid?", "Google review requests"],
    ["Who owns our domain and ads accounts at handoff?", "Who owns the accounts"],
    ["How do we follow up when quotes go quiet?", "Quote requests"],
    ["How do we get old leads back into the pipeline?", "Reactivating old leads"],
    ["Can we rebook appointment no-shows?", "Appointment reminders"],
    ["Do our missed calls get a text?", "Missed calls"],
    ["How does Talkerstein use GHL to manage leads?", "How Talkerstein uses"],
  ];
  for (const [question, title] of cases) {
    const notes = selectPracticeNotes(question);
    expect(notes.some(note => note.title.startsWith(title)), question).toBeTruthy();
    expect(JSON.stringify(notes)).not.toMatch(/https?:|@/);
  }
  expect(selectPracticeNotes("Show me a retail website you built")).toEqual([]);
});

test("pricing uses the booking flow while CRM diagnosis uses curated evidence", async () => {
  const {POST} = await import("../app/api/chatbot/route");
  const {asksForPricing} = await import("../lib/chatbot/pricing");
  expect(asksForPricing("How much does it cost per lead?")).toBe(false);
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "fixture";
  const inputs: string[] = [];
  globalThis.fetch = async (_url, options) => {
    const input = JSON.parse(String(options?.body)).input;
    inputs.push(input[0].content);
    return Response.json({status: "completed", output: [{content: [{type: "output_text", text: JSON.stringify({
      bookingIntent: inputs.length === 1 ? "continue" : "pricing",
      answer: inputs.length === 1 ? "Check the form mapping." : "An unapproved estimate.",
      sources: [], followups: [], paraphrases: [], evidenceRequest: "", meetingBrief: "",
    })}]}]});
  };
  const ask = async (content: string) => (await POST(new Request("http://localhost/api/chatbot", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({messages: [{role: "user", content}], previousBrief: "Website migration."}),
  }))).json();
  try {
    const direct = await ask("How much do you charge for a website?");
    expect(direct.invite).toBe(true);
    expect(direct.meetingBrief).toContain("Website migration.");
    expect(inputs).toHaveLength(0);
    const diagnosis = await ask("Why do duplicate form submissions erase earlier CRM answers?");
    expect(diagnosis.answer).toBe("Check the form mapping.");
    const fixture = JSON.parse(inputs[0].split("\n").slice(1).join("\n"));
    expect(fixture.practiceNotes[0].title).toContain("form leads");
    expect(fixture.publicPages.length + fixture.practiceNotes.length).toBeLessThanOrEqual(5);
    const indirect = await ask("Would my budget cover a full rebuild?");
    expect(indirect.answer).toBe(direct.answer);
    expect(indirect.invite).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("the portfolio sleeps offscreen and resumes when visible", async ({page}) => {
  await page.emulateMedia({reducedMotion: "no-preference"});
  await page.goto("/chatbot");
  const gallery = page.locator(".sphere-main");
  const sphere = gallery.locator(".sphere");
  const transform = () => sphere.evaluate(el => (el as HTMLElement).style.transform);
  await gallery.evaluate(el => el.scrollIntoView({block: "center", behavior: "instant"}));
  const visible = await transform();
  await expect.poll(transform).not.toBe(visible);
  await page.evaluate(() => scrollTo({top: 0, behavior: "instant"}));
  await expect(gallery).not.toBeInViewport();
  const writes = await sphere.evaluate(el => new Promise<number>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      let count = 0;
      const observer = new MutationObserver(records => { count += records.length; });
      observer.observe(el, {attributes: true, attributeFilter: ["style"]});
      setTimeout(() => { observer.disconnect(); resolve(count); }, 250);
    }));
  }));
  expect(writes).toBe(0);
});

test("a vertical swipe on the portfolio scrolls the page", async ({page, isMobile}) => {
  test.skip(!isMobile, "Requires touch input");
  await page.goto("/chatbot");
  const gallery = page.locator(".sphere-main");
  await gallery.evaluate(el => el.scrollIntoView({block: "center", behavior: "instant"}));
  const box = (await gallery.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const start = await page.evaluate(() => scrollY);
  const touch = await page.context().newCDPSession(page);
  await touch.send("Input.dispatchTouchEvent", {type: "touchStart", touchPoints: [{x, y}]});
  for (const offset of [24, 60, 100, 150]) {
    await touch.send("Input.dispatchTouchEvent", {type: "touchMove", touchPoints: [{x, y: y - offset}]});
  }
  await touch.send("Input.dispatchTouchEvent", {type: "touchEnd", touchPoints: []});
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(start + 60);
  await expect(page.locator(".viewer .enlarge")).toHaveCount(0);
});

test("landing titles and prompt examples stagger their words, and the menu returns focus", async ({page}) => {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/chatbot");
  const headline = page.getByRole("heading", {level:1, name:"Better Business Systems"});
  await expect(headline).toHaveCSS("animation-name", "hero-fade-in");
  const sequence = await page.locator(".hero h1, .hero .deck, .hero-media, .hero .rotor")
    .evaluateAll(els => els.map(el => parseFloat(getComputedStyle(el).animationDelay)));
  expect(sequence).toEqual([0, .16, .32, .44]);
  const firstSectionTitle = page.locator(".row-copy h2").first();
  await expect(firstSectionTitle).not.toHaveClass(/title-entered/);
  await firstSectionTitle.scrollIntoViewIfNeeded();
  await expect(firstSectionTitle).toHaveClass(/title-entered/);
  await page.getByRole("button", {name:"Next example"}).click();
  const words = page.locator(".prompt-example > span");
  await expect(words.first()).toHaveCSS("animation-name", "prompt-word-in");
  expect(await words.evaluateAll(spans => spans.map(el => parseFloat(getComputedStyle(el).animationDelay))))
    .toEqual(await words.evaluateAll(spans => spans.map((_, i) => i * 45 / 1000)));
  const input = page.getByRole("combobox");
  await input.fill("My question");
  await expect(page.locator(".prompt-example")).toHaveCount(0);
  const menu = page.getByRole("banner").getByRole("button", {name:"Menu"});
  await menu.click();
  const dialog = page.getByRole("dialog", {name:"Main menu"});
  await expect(dialog.getByRole("link")).toHaveCount(4);
  const clearance = await dialog.evaluate(el => {
    const panel = el.getBoundingClientRect();
    const links = el.querySelector("nav")!.getBoundingClientRect();
    return Math.abs((links.top - panel.top) - (panel.bottom - links.bottom));
  });
  expect(clearance).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(menu).toBeFocused();
  await expect(input).toHaveValue("My question");
});

test("bottom suggestions rotate independently of the paused hero and submit the displayed example", async ({page}) => {
  await page.route("**/api/chatbot", route => route.fulfill({json:{answer:"Example received.",sources:[],followups:[]}}));
  await page.goto("/chatbot");
  await page.getByRole("button", {name:"Next example"}).click();
  await expect(page.getByRole("button", {name:"Play examples"})).toBeVisible();
  await page.locator(".vis.bare").scrollIntoViewIfNeeded();
  const input = page.getByRole("combobox");
  const dock = page.locator('.agency-composer[data-docked="true"]');
  await expect(dock).toBeInViewport();
  const first = await input.getAttribute("placeholder");
  await expect(input).not.toHaveAttribute("placeholder", first!, {timeout:9000});
  await input.focus();
  const example = await input.getAttribute("placeholder");
  await expect(page.locator(".rotor .count")).toHaveText("2 / 10");
  const shown = example!.slice(5, -1);
  await dock.getByRole("button", {name:"Ask this example"}).click();
  await expect(page.locator(".msg-u").last()).toHaveText(shown);
});

test("the hero card and prompt share both upper corner centers", async ({page}) => {
  await page.goto("/chatbot");
  const offsets = await page.locator(".hero-media").evaluate(el => {
    const plate = el.querySelector(".plate")!;
    const form = el.querySelector("form")!;
    const outer = plate.getBoundingClientRect(), inner = form.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(plate).borderTopLeftRadius);
    return [inner.top - outer.top, inner.left - outer.left, outer.right - inner.right]
      .map(gap => Math.abs(radius - gap - inner.height / 2));
  });
  for (const offset of offsets) expect(offset).toBeLessThan(0.5);
});
