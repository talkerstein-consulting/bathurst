/**
 * The site's own dropdown for a native <select> (Find Your Way Forward's "Choose your destination"): a field-styled
 * button, and a framed paper list that opens under it. The <select> stays in the form, hidden, as the source of truth:
 * a pick sets its value and fires input + change, so form data, `required` and React's onChange all keep working.
 * The list is appended to <body> (position: fixed) because the direction cards clip their overflow while they slide.
 * Returns `sync`, for when the select's value is changed from outside (a prefilled React state).
 */
const CHECK = '<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
let uid = 0;

export function brandSelect(sel: HTMLSelectElement): () => void {
  const prior = (sel as HTMLSelectElement & { _brandSync?: () => void })._brandSync;
  if (prior) return prior;
  const id = `bsel-${++uid}`;
  const opts = () => [...sel.options].filter((o) => o.value);
  const placeholder = [...sel.options].find((o) => !o.value)?.text ?? "";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "input bsel-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", id);
  const label = sel.getAttribute("aria-label");
  sel.classList.add("bsel-native");
  sel.tabIndex = -1;
  sel.setAttribute("aria-hidden", "true");
  sel.after(btn);

  const sync = () => {
    const o = sel.selectedOptions[0];
    const has = !!o?.value;
    btn.textContent = has ? o.text : placeholder;
    btn.classList.toggle("ph", !has);
    btn.setAttribute("aria-label", has ? `${label}: ${o.text}` : label || placeholder);
  };
  sync();

  let list: HTMLDivElement | null = null, active = 0;
  const pick = (v: string) => {
    // the native setter, so React's value tracker sees the change as the user's
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(sel, v);
    sel.dispatchEvent(new Event("input", { bubbles: true }));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    sync();
  };
  const mark = () => list?.querySelectorAll<HTMLElement>("[role=option]").forEach((li, i) => {
    li.classList.toggle("on", i === active);
    if (i === active) { btn.setAttribute("aria-activedescendant", li.id); li.scrollIntoView({ block: "nearest" }); }
  });
  const place = () => {
    if (!list) return;
    const r = (btn.closest(".dir-box") ?? btn).getBoundingClientRect(), h = list.offsetHeight;
    const below = innerHeight - r.bottom - 8 >= h || r.top < h + 8;   // room below, or no more room above either
    list.style.left = `${r.left}px`;
    list.style.width = `${r.width}px`;
    list.style.top = `${below ? r.bottom + 6 : r.top - 6 - h}px`;
  };
  const close = (focus = false) => {
    if (!list) return;
    list.remove(); list = null;
    btn.setAttribute("aria-expanded", "false");
    btn.removeAttribute("aria-activedescendant");
    removeEventListener("scroll", onAway, true); removeEventListener("resize", onAway); document.removeEventListener("pointerdown", onDown, true);
    if (focus) btn.focus({ preventScroll: true });
  };
  const onAway = (e: Event) => { if (!list?.contains(e.target as Node)) close(); };
  const onDown = (e: PointerEvent) => { if (!list?.contains(e.target as Node) && e.target !== btn) close(); };
  const open = () => {
    if (list) return;
    const items = opts();
    active = Math.max(0, items.findIndex((o) => o.selected));
    list = document.createElement("div");
    list.className = "bsel-list frame";
    list.innerHTML = `<p class="eyebrow" aria-hidden="true">${placeholder}</p><ul role="listbox" id="${id}" aria-label="${label ?? placeholder}">${items
      .map((o, i) => `<li role="option" id="${id}-${i}" aria-selected="${o.selected}" data-v="${o.value}"><span>${o.text}</span>${CHECK}</li>`).join("")}</ul>`;
    document.body.appendChild(list);
    list.querySelectorAll<HTMLElement>("[role=option]").forEach((li, i) => {
      li.addEventListener("pointermove", () => { if (active !== i) { active = i; mark(); } });
      li.addEventListener("click", () => { pick(li.dataset.v!); close(true); });
    });
    btn.setAttribute("aria-expanded", "true");
    place(); mark();
    addEventListener("scroll", onAway, true); addEventListener("resize", onAway); document.addEventListener("pointerdown", onDown, true);
  };

  btn.addEventListener("click", () => (list ? close() : open()));
  btn.addEventListener("keydown", (e) => {
    const n = opts().length;
    if (!list) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); open(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % n; mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + n) % n; mark(); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); active = e.key === "Home" ? 0 : n - 1; mark(); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(opts()[active].value); close(true); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === "Tab") close();
  });
  sel.addEventListener("change", sync);
  (sel as HTMLSelectElement & { _brandSync?: () => void })._brandSync = sync;
  return sync;
}
