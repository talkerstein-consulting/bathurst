/* eslint-disable */
// @ts-nocheck
/**
 * Everything the static page ran in its two <script> tags: the hero photo carousel, the
 * full-screen chat, the sentence's picture slots, the line system behind every CTA, and the
 * pinned ask bar. Called once from components/Prototype.tsx after mount.
 */
export default function runPrototype() {

  /* ---------- the line system (ported from components/style/LineSystem.tsx) ----------
     Draws every CTA's lines as SVG and wires the hover. The outer line is cut into dashes
     seeded around the path, so it grows out of several points at once rather than sliding in. */
  (() => {
    const NS = "http://www.w3.org/2000/svg";
    const root = getComputedStyle(document.documentElement);
    const num = (n) => parseFloat(root.getPropertyValue(n)) || 0;
    const so = num("--outer-stroke"), si = num("--inner-stroke"), gap = num("--gap"), draw = num("--cta-draw");

    /** the label and its twin, so the text can tumble */
    function twin(el) {
      if (el.querySelector(":scope > .label") || el.hasAttribute("data-no-tumble")) return;
      // .label is white-space: pre, so markup indentation would break the line in two
      const inner = el.innerHTML.split(/\s+/).join(" ").trim();
      if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.trim());
      const label = document.createElement("span");
      label.className = "label";
      label.setAttribute("aria-hidden", "true");
      label.innerHTML = "<span>" + inner + "</span><span>" + inner + "</span>";
      el.innerHTML = "";
      el.appendChild(label);
    }

    /** about one seed per 70px of path, evenly spaced from a random start, jittered */
    function seed(el) {
      const g = el.querySelector(":scope > .stroke g");
      if (!g || !el._d) return;
      g.querySelectorAll(".outer").forEach((p) => p.remove());
      const open = el._open, per = el._per || 0;
      const n = open ? Math.max(2, Math.min(5, Math.round(per / 70))) : Math.max(3, Math.min(7, Math.round(per / 70)));
      const step = 1 / n, start = open ? step / 2 : Math.random();
      const seeds = Array.from({ length: n }, (_, k) => start + k * step + (Math.random() - .5) * .6 * step);
      seeds.forEach((sd, k) => {
        let from, to;
        if (open) {
          from = k ? (seeds[k - 1] + sd) / 2 : 0;
          to = k < n - 1 ? (sd + seeds[k + 1]) / 2 : 1;
        } else {
          const prev = k ? seeds[k - 1] : seeds[n - 1] - 1, next = k < n - 1 ? seeds[k + 1] : seeds[0] + 1;
          from = (prev + sd) / 2;
          to = (sd + next) / 2;
        }
        const len = Math.min(1, to - from + (open ? 0 : .002));
        const sN = open ? sd : ((sd % 1) + 1) % 1;
        const path = document.createElementNS(NS, "path");
        path.setAttribute("class", "outer");
        path.setAttribute("pathLength", "1");
        path.setAttribute("d", el._d);
        path.style.cssText = "--seed:" + sN + ";--from:" + (sN - (sd - from)) + ";--len:" + len
          + ";--rest:" + (1 - len) + ";--delay:" + Math.round(Math.random() * 90) + "ms";
        g.appendChild(path);
      });
      el._seeded = true;
    }

    function geometry(el, W, H, radius) {
      const svg = el.querySelector(":scope > .stroke");
      if (!svg || !W) return;
      const inner = svg.querySelector(".inner");
      if (el._open) {
        // a .link: one rule under the text, the thicker one a gap below it
        inner.setAttribute("d", "M0 " + (H - so - gap - si / 2) + "H" + W);
        el._d = "M0 " + (H - so / 2) + "H" + W;
        el._per = W;
      } else {
        const R = Math.min(radius, H / 2, W / 2);
        const i = so / 2, r = Math.max(0, R - i), cx = W / 2;
        const j = so + gap + si / 2, rj = Math.max(0, R - j);
        const rrect = (k, rk) =>
          "M" + cx + " " + k + "H" + (W - k - rk) + "A" + rk + " " + rk + " 0 0 1 " + (W - k) + " " + (k + rk)
          + "V" + (H - k - rk) + "A" + rk + " " + rk + " 0 0 1 " + (W - k - rk) + " " + (H - k)
          + "H" + (k + rk) + "A" + rk + " " + rk + " 0 0 1 " + k + " " + (H - k - rk)
          + "V" + (k + rk) + "A" + rk + " " + rk + " 0 0 1 " + (k + rk) + " " + k + "Z";
        inner.setAttribute("d", rrect(j, rj));
        el._d = rrect(i, r);
        el._per = 2 * (W - 2 * i - 2 * r) + 2 * (H - 2 * i - 2 * r) + 2 * Math.PI * r;
      }
      if (!el._seeded) seed(el); else svg.querySelectorAll(".outer").forEach((p) => p.setAttribute("d", el._d));
    }

    const ro = new ResizeObserver((es) => es.forEach((e) => {
      const el = e.target, b = e.borderBoxSize && e.borderBoxSize[0];
      geometry(el, b ? b.inlineSize : el.offsetWidth, b ? b.blockSize : el.offsetHeight,
        parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
    }));

    document.querySelectorAll(".sprout").forEach((el) => {
      el._open = el.classList.contains("link");
      twin(el);
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "stroke");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = '<g filter="url(#grunge)"><path class="inner"/></g>';
      el.prepend(svg);
      const sync = () => setTimeout(() => {
        const on = el.matches(":hover, :focus-visible");
        el.classList.toggle("on", on);
        clearTimeout(el._t);
        // re-seed once the line has fully retracted, never on the way in
        if (!on) el._t = setTimeout(() => { if (!el.classList.contains("on")) seed(el); }, draw + 150);
      }, 0);
      ["pointerenter", "pointerleave", "focusin", "focusout"].forEach((e) => el.addEventListener(e, sync));
      ro.observe(el);
    });
  })();

  /* ---- next script ---- */

  /* ---------- the map opens full screen ----------
     In the page the plate is a picture of the map with a click target over it; full
     screen is where it is actually worked, so the target comes off while it is open. */
  (() => {
    const plate = document.getElementById("mapplate");
    const open = document.getElementById("mapopen");
    const close = document.getElementById("mapclose");
    if (!plate || !open) return;

    /* the plate takes the whole window itself rather than asking for native full screen:
       the API is refused inside an embedded browser and is not supported for an element
       on iOS, and this behaves the same everywhere. */
    function show(on) {
      plate.classList.toggle("full", on);
      document.body.classList.toggle("mapopen", on);
      if (on) close?.focus();
      else open.focus();
    }
    open.addEventListener("click", () => show(true));
    close?.addEventListener("click", () => show(false));
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && plate.classList.contains("full")) show(false);
    });
  })();

  /* ---------- the folio dateline ----------
     Filled in here rather than at build time: the page is static, and a front page that
     prints the day it was deployed is worse than no date at all. Toronto's day, not the
     reader's, since that is the business the paper is set in. */
  (() => {
    const el = document.getElementById("folio-date");
    if (!el) return;
    try {
      /* compact, day first: 20 Nov 2026 */
      el.textContent = new Date().toLocaleDateString("en-GB", {
        timeZone: "America/Toronto",
        day: "2-digit", month: "short", year: "numeric",
      });
    } catch { /* leave the fallback edition line in place */ }
  })();

  /* ---------- the rotating hero example ----------
     One question per photo, same order as the <img> stack in .shots. */
  const EXAMPLES = [
    "Quotes take me three hours every night",
    "Customers can’t book a service slot online",
    "Our reservations all come in by phone",
    "We still do intake on paper",
    "Half our clients no-show their appointment",
    "We want online ordering without the delivery apps",
    "Event enquiries get lost in my inbox",
    "Patients can’t see when we’re free",
    "The shop and the website disagree on stock",
    "Catering orders arrive six different ways"
  ];

  const shots = [...document.querySelectorAll("#shots img")];
  const input = document.getElementById("q");
  const count = document.getElementById("count");
  const cap = document.querySelector("#cap span");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let i = 0, timer;

  function render(n) {
    i = (n + EXAMPLES.length) % EXAMPLES.length;
    input.placeholder = "Try ‘" + EXAMPLES[i] + "’";
    count.textContent = "No. " + (i + 1) + " of " + EXAMPLES.length;
    cap.textContent = "Fig. " + (i + 1) + " — " + EXAMPLES[i] + ".";
    shots.forEach((img, n2) => img.classList.toggle("on", n2 === i));
  }

  function cycle() {
    clearInterval(timer);
    timer = setInterval(() => render(i + 1), 6000);
  }

  document.getElementById("next").addEventListener("click", () => { render(i + 1); cycle(); });
  document.getElementById("prev").addEventListener("click", () => { render(i - 1); cycle(); });
  render(0);
  if (!reduced) cycle();

  /* typing in the hero bar pauses the rotation */
  input.addEventListener("focus", () => clearInterval(timer));

  /* ---------- the sentence opens its picture slots once it is on screen ---------- */
  const statement = document.querySelector(".statement");
  new IntersectionObserver((es, ob) => {
    es.forEach(e => { if (e.isIntersecting) { statement.classList.add("is-open"); ob.disconnect(); } });
  }, { threshold: .35 }).observe(statement);

  /* ---------- the chat ----------
     It does not exist on the page. Sending a first message from any ask bar opens it full
     screen, carrying what was typed in as the question the conversation answers. Typing alone
     does nothing: it opens on send. */
  const chat = document.getElementById("chatsec");
  const thread = chat.querySelector(".thread");
  const scroller = chat.querySelector(".thread-scroll");
  let opened = false, first = true;

  // every turn in the canned thread is a beat; they are held back and played in order
  const beats = [...thread.children];
  beats.forEach((b) => b.classList.add("beat"));

  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
  const show = (el) => { el.hidden = false; el.scrollIntoView({ block: "end", behavior: reduced ? "auto" : "smooth" }); };

  /** the assistant thinking, for as long as the answer is long */
  async function think(ms) {
    const dots = document.createElement("div");
    dots.className = "typing";
    dots.innerHTML = '<i><img src="brand/tcg-icon.svg" alt=""></i>'
      + "<b><span></span><span></span><span></span></b>";
    thread.appendChild(dots);
    dots.scrollIntoView({ block: "end", behavior: reduced ? "auto" : "smooth" });
    await wait(ms);
    dots.remove();
  }

  /** plays the thread out from the beat after the opening question */
  async function play() {
    for (let i = 1; i < beats.length; i++) {
      const b = beats[i];
      if (b.classList.contains("msg-u")) {
        await wait(900);              // a beat before the next thing is asked
        show(b);
        continue;
      }
      // an answer: think first, longer when there is more of it to say
      await wait(400);
      await think(Math.min(2200, 700 + b.textContent.trim().length * 4));
      show(b);
      await wait(500);
    }
  }

  function openChat(text) {
    if (!text) return;
    if (!opened) {
      opened = true;
      chat.hidden = false;
      document.documentElement.classList.add("chatting");
      clearInterval(timer);                 // the hero's photos are not the subject any more
      pinned.classList.remove("on");
      beats.forEach((b, i) => { if (i > 0) b.hidden = true; });
    }
    if (first) {
      // what was typed becomes the question the thread answers, not a line tacked on the end
      first = false;
      thread.querySelector(".msg-u").textContent = text;
      scroller.scrollTop = 0;
      play();
    } else {
      const said = document.createElement("p");
      said.className = "msg-u beat";
      said.textContent = text;
      thread.appendChild(said);
      said.scrollIntoView({ block: "end", behavior: reduced ? "auto" : "smooth" });
      // the mockup has no answers past the scripted ones, so it thinks and then says so
      (async () => {
        await wait(500);
        await think(1500);
        const reply = document.createElement("div");
        reply.className = "msg-a beat";
        reply.innerHTML = '<span class="who"><i><img src="brand/tcg-icon.svg" alt=""></i>Talkerstein</span>'
          + "<p>This is a front-end mockup, so that is as far as the conversation goes for now.</p>";
        thread.appendChild(reply);
        reply.scrollIntoView({ block: "end", behavior: reduced ? "auto" : "smooth" });
      })();
    }
    chat.querySelector(".chat-foot input").focus();
  }

  function closeChat() {
    chat.hidden = true;
    document.documentElement.classList.remove("chatting");
    opened = false;
    first = true;
    thread.querySelectorAll(".typing").forEach((n) => n.remove());
    [...thread.children].forEach((b, i) => { if (!beats.includes(b)) b.remove(); else b.hidden = i > 0; });
    document.getElementById("q").focus();
  }

  document.querySelectorAll("form.ask").forEach((form) => {
    const field = form.querySelector("input");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = field.value.trim();
      if (!text) return;
      field.value = "";
      openChat(text);
    });
  });

  document.getElementById("chatclose").addEventListener("click", closeChat);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && opened) closeChat(); });

  /* ---------- header hairline + pinned ask bar ---------- */
  const head = document.getElementById("head");
  const pinned = document.getElementById("pinned");
  const heroAsk = document.querySelector(".hero .ask");

  // the pinned bar shows only once the hero's own bar has left the screen
  new IntersectionObserver(([e]) => {
    pinned.classList.toggle("on", !e.isIntersecting && !opened);
  }, { threshold: 0 }).observe(heroAsk);

  addEventListener("scroll", () => {
    head.classList.toggle("stuck", scrollY > 8);
  }, { passive: true });

}
