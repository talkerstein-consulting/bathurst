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

test("the scrolled ask control stays in the header and can receive a tap above the artwork", async ({page}) => {
  await page.goto("/chatbot");
  await page.locator(".vis.bare").scrollIntoViewIfNeeded();
  const ask = page.getByRole("button", {name:"Ask Talkerstein"});
  await expect(ask).toBeInViewport();
  const bounds = await ask.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(80);
  expect(await page.locator(".vis.bare").evaluate(el => getComputedStyle(el).isolation)).toBe("isolate");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await ask.click();
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
  await page.locator(".ask-return").waitFor();
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

test("landing titles and prompt examples stagger their words, and the menu returns focus", async ({page}) => {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/chatbot");
  const headline = page.getByRole("heading", {level:1, name:"Better Business Systems"});
  await expect(headline).toHaveClass(/title-entered/);
  await expect(headline.locator(".rise-w > span").last()).toHaveCSS("animation-name", "title-word-in");
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
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(menu).toBeFocused();
  await expect(input).toHaveValue("My question");
});
