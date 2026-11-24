"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUp02Icon,
  Attachment01Icon,
  DashboardSpeed01Icon,
  FlashIcon,
  Layers01Icon,
  Tick02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const canvas = "bg-white dark:bg-neutral-950";
const text1 = "text-neutral-900 dark:text-neutral-100";
const text2 = "text-neutral-900/80 dark:text-neutral-100/80";
const text3 = "text-neutral-900/66 dark:text-neutral-100/66";
const ruleTop = "border-t border-neutral-900/8 dark:border-neutral-100/8";
const overlayShadow =
  "shadow-[0_12px_24px_-12px_rgb(0_0_0/0.2)] dark:shadow-[0_12px_24px_-12px_rgb(0_0_0/0.6)]";
const typeLabel = "text-[14px]/[16px] font-[450]";
const typeLabelSm = "text-[12px]/[16px] font-[450] tabular-nums";
const typeBodySm = "text-[13px]/[18px] font-normal";
const typeCaption = "text-[12px]/[16px] font-normal tabular-nums";
const primaryButton =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,outline-color,scale,filter] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.98] active:duration-[60ms] motion-reduce:active:scale-100 disabled:cursor-not-allowed aria-busy:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_84%,white),color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_94%,black))] text-[var(--rb-accent-fg,oklch(100%_0_0))] shadow-[inset_0_2px_0_-1px_rgb(255_255_255/0.2),inset_0_-2px_0_-1px_rgb(0_0_0/0.3),inset_0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_88%,black),0_1px_1px_rgb(0_0_0/0.22),0_2px_5px_-2px_rgb(0_0_0/0.3)] hover:not-disabled:brightness-110 active:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_88%,black),inset_0_1px_2px_rgb(0_0_0/0.42)] disabled:opacity-40 disabled:shadow-none dark:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_84%,white),color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_94%,black))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:shadow-[inset_0_2px_0_-1px_rgb(255_255_255/0.2),inset_0_-2px_0_-1px_rgb(0_0_0/0.3),inset_0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_88%,black),0_1px_1px_rgb(0_0_0/0.66),0_2px_5px_-2px_rgb(0_0_0/0.9)] dark:active:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_88%,black),inset_0_1px_2px_rgb(0_0_0/0.42)] dark:disabled:shadow-none";
const ghostButton =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,outline-color,scale,filter] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.98] active:duration-[60ms] motion-reduce:active:scale-100 disabled:cursor-not-allowed aria-busy:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] bg-transparent text-neutral-900 hover:not-disabled:bg-neutral-900/5 active:bg-neutral-900/8 aria-pressed:bg-neutral-900/9 disabled:text-neutral-900/40 dark:text-neutral-100 dark:hover:not-disabled:bg-neutral-100/5 dark:active:bg-neutral-100/8 dark:aria-pressed:bg-neutral-100/9 dark:disabled:text-neutral-100/40";
const ghostButtonMuted =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,outline-color,scale,filter] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.98] active:duration-[60ms] motion-reduce:active:scale-100 disabled:cursor-not-allowed aria-busy:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] bg-transparent text-neutral-900/80 hover:not-disabled:bg-neutral-900/5 hover:not-disabled:text-neutral-900 active:bg-neutral-900/8 aria-expanded:bg-neutral-900/5 aria-expanded:text-neutral-900 disabled:text-neutral-900/40 dark:text-neutral-100/80 dark:hover:not-disabled:bg-neutral-100/5 dark:hover:not-disabled:text-neutral-100 dark:active:bg-neutral-100/8 dark:aria-expanded:bg-neutral-100/5 dark:aria-expanded:text-neutral-100 dark:disabled:text-neutral-100/40";
const buttonXs =
  "h-6 gap-1 rounded-[var(--rb-r-sm,6px)] px-2 text-[12px]/[16px] font-[450] tabular-nums";
const iconButtonSm = "size-7 rounded-[var(--rb-r-sm,6px)]";
const segmentedTrack =
  "inline-flex w-fit max-w-full items-stretch gap-0.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-900/5 p-0.5 dark:bg-neutral-100/5";
const segmentedMd = "h-8";
const segmentXs =
  "relative inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap [&_svg]:shrink-0 rounded-[var(--rb-r-xs,4px)] px-2 text-[12px]/[16px] font-[450] tabular-nums text-neutral-900/80 select-none transition-[background-color,color,outline-color] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:not-aria-checked:bg-neutral-900/5 hover:not-aria-checked:text-neutral-900 active:not-aria-checked:bg-neutral-900/8 aria-checked:bg-white aria-checked:text-neutral-900 aria-checked:shadow-[0_1px_2px_rgb(0_0_0/0.1)] disabled:cursor-not-allowed disabled:text-neutral-900/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] dark:text-neutral-100/80 dark:hover:not-aria-checked:bg-neutral-100/5 dark:hover:not-aria-checked:text-neutral-100 dark:active:not-aria-checked:bg-neutral-100/8 dark:aria-checked:bg-neutral-700 dark:aria-checked:text-neutral-100 dark:aria-checked:shadow-[0_0_0_1px_rgb(255_255_255/0.16),0_1px_2px_rgb(0_0_0/0.3)] dark:disabled:text-neutral-100/40";
const badge =
  "inline-flex h-5 min-w-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-[var(--rb-r-xs,4px)] px-1.5 text-[12px]/[16px] font-[450] tabular-nums";
const badgeNeutral =
  "bg-neutral-900/9 dark:bg-neutral-100/9 text-neutral-900 dark:text-neutral-100";
const frame =
  "relative flex min-w-0 flex-col overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-900/10 dark:border-neutral-100/14 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100";
const progressTrack =
  "relative block h-1 w-full overflow-hidden bg-neutral-900/7 dark:bg-neutral-100/7";
const progressFill =
  "block h-full bg-neutral-900 transition-[width] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none dark:bg-neutral-100";
const menuPopup =
  "min-w-48 max-w-[min(480px,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[var(--rb-r-lg,10px)] border border-neutral-900/10 dark:border-neutral-100/14 bg-white dark:bg-neutral-900 p-1 text-neutral-900 dark:text-neutral-100 outline-none shadow-[0_12px_24px_-12px_rgb(0_0_0/0.2)] dark:shadow-[0_12px_24px_-12px_rgb(0_0_0/0.6)]";
const menuItem =
  "relative flex min-h-8 w-full cursor-default items-center gap-2 rounded-[var(--rb-r-sm,6px)] px-2 py-1.5 text-left text-[14px]/[16px] font-[450] text-neutral-900 outline-none select-none [&_svg]:shrink-0 [&_svg]:text-neutral-900/80 hover:bg-neutral-900/5 focus-visible:bg-neutral-900/5 data-[highlighted]:bg-neutral-900/5 aria-selected:bg-neutral-900/9 aria-disabled:cursor-not-allowed aria-disabled:text-neutral-900/40 dark:text-neutral-100 dark:[&_svg]:text-neutral-100/80 dark:hover:bg-neutral-100/5 dark:focus-visible:bg-neutral-100/5 dark:data-[highlighted]:bg-neutral-100/5 dark:aria-selected:bg-neutral-100/9 dark:aria-disabled:text-neutral-100/40";
const menuLabel =
  "px-2 pt-2 pb-1 text-[12px]/[16px] font-normal tabular-nums text-neutral-900/66 dark:text-neutral-100/66";
const overlayEnter =
  "transition-opacity duration-[160ms] ease-[cubic-bezier(0.2,0,0,1)] starting:opacity-0 motion-reduce:transition-none";
const userBubble =
  "w-fit max-w-full rounded-[var(--rb-r-lg,10px)] border border-neutral-900/10 dark:border-neutral-100/14 bg-white dark:bg-neutral-900 px-3.5 py-2 text-[14px]/[20px] whitespace-pre-wrap text-neutral-900 dark:text-neutral-100 [overflow-wrap:anywhere]";
const prose =
  "flex min-w-0 flex-col gap-3 text-[14px]/[20px] text-neutral-900 dark:text-neutral-100 [overflow-wrap:anywhere]";
const composer =
  "relative flex w-full min-w-0 flex-col rounded-[var(--rb-r-lg,10px)] border border-neutral-900/12 bg-white text-neutral-900 dark:text-neutral-100 shadow-[0_1px_2px_-1px_rgb(0_0_0/0.12)] transition-[border-color,box-shadow] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:not-focus-within:border-neutral-900/32 focus-within:border-[var(--rb-accent,oklch(20.5%_0_0))] focus-within:ring-3 focus-within:ring-neutral-900/8 dark:border-neutral-100/14 dark:bg-neutral-900 dark:shadow-[0_1px_2px_-1px_rgb(0_0_0/0.36)] dark:hover:not-focus-within:border-neutral-100/32 dark:focus-within:border-[var(--rb-accent,oklch(100%_0_0))] dark:focus-within:ring-neutral-100/8";
const composerInput =
  "max-h-40 min-h-5 min-w-0 flex-auto resize-none bg-transparent px-1.5 py-1 field-sizing-content text-[14px]/[20px] text-neutral-900 dark:text-neutral-100 outline-none placeholder:text-neutral-900/66 dark:placeholder:text-neutral-100/66";

type Effort = "brief" | "balanced" | "detailed";

type Model = {
  id: string;
  name: string;
  provider: string;
  note?: string;
  summary: string;
  context: string;
  speed: string;
  cost: string;
  efforts: Effort[];
};

const MODELS: Model[] = [
  {
    id: "auto",
    name: "Auto",
    provider: "Northwind AI",
    note: "Recommended",
    summary: "Routes every turn to whichever model fits the request best.",
    context: "200K tokens",
    speed: "Varies by turn",
    cost: "Metered",
    efforts: ["brief", "balanced", "detailed"],
  },
  {
    id: "atlas",
    name: "Atlas",
    provider: "Meridian Labs",
    summary:
      "The strongest general model. Best for multi-step work that spans several files.",
    context: "200K tokens",
    speed: "Standard",
    cost: "4 credits per turn",
    efforts: ["brief", "balanced", "detailed"],
  },
  {
    id: "atlas-long",
    name: "Atlas Long",
    provider: "Meridian Labs",
    note: "1M context",
    summary:
      "Atlas with a one million token window for whole repositories and long transcripts.",
    context: "1M tokens",
    speed: "Slower to first token",
    cost: "9 credits per turn",
    efforts: ["balanced", "detailed"],
  },
  {
    id: "quill",
    name: "Quill",
    provider: "Meridian Labs",
    summary:
      "Tuned for drafting and rewriting prose. Keeps tone and structure steady.",
    context: "128K tokens",
    speed: "Fast",
    cost: "2 credits per turn",
    efforts: [],
  },
  {
    id: "ember",
    name: "Ember",
    provider: "Orbital",
    summary: "Quick and inexpensive. Good for small edits and short answers.",
    context: "64K tokens",
    speed: "Fastest",
    cost: "1 credit per turn",
    efforts: ["brief", "balanced"],
  },
  {
    id: "wren",
    name: "Wren",
    provider: "Orbital",
    note: "On device",
    summary: "Runs locally. Nothing in the conversation leaves this machine.",
    context: "32K tokens",
    speed: "Depends on hardware",
    cost: "Free",
    efforts: [],
  },
];

const EFFORTS: {
  id: Effort;
  label: string;
  segments: number;
  blurb: string;
}[] = [
  {
    id: "brief",
    label: "Brief",
    segments: 1,
    blurb: "Answers immediately with little planning.",
  },
  {
    id: "balanced",
    label: "Balanced",
    segments: 3,
    blurb: "Thinks through the request before answering.",
  },
  {
    id: "detailed",
    label: "Detailed",
    segments: 5,
    blurb: "Plans at length and checks its own work.",
  },
];

/* The registry ships this component with a worked-out sample conversation
   about a "depot capacity model". That is invented content, and under a
   notice saying nothing has been sent it reads as a real exchange, so it is
   emptied here. Re-installing from the registry restores it — strip it
   again, or give the component a `messages` prop. */
const THREAD: Array<{ id: string; role: "user" | "assistant"; text: string }> = [];

export default function AiChat9() {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("atlas");
  const [active, setActive] = useState(1);
  const [effort, setEffort] = useState<Record<string, Effort>>({
    auto: "balanced",
    atlas: "balanced",
    "atlas-long": "detailed",
    ember: "brief",
  });
  const [value, setValue] = useState("");

  const selectedModel = useMemo(
    () => MODELS.find((m) => m.id === selected) ?? MODELS[0],
    [selected],
  );
  const preview = MODELS[active];
  const previewEffort = effort[preview.id] ?? preview.efforts[0];
  const previewSegments =
    EFFORTS.find((e) => e.id === previewEffort)?.segments ?? 0;

  useEffect(() => {
    if (!open) return;
    const doc = rootRef.current?.ownerDocument ?? document;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    doc.addEventListener("keydown", onKey);
    doc.addEventListener("pointerdown", onPointerDown);
    return () => {
      doc.removeEventListener("keydown", onKey);
      doc.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);

  const commit = (index: number) => {
    setSelected(MODELS[index].id);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const onListKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i + 1) % MODELS.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i - 1 + MODELS.length) % MODELS.length);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(MODELS.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(active);
        break;
    }
  };

  const setPreviewEffort = (next: Effort) =>
    setEffort((prev) => ({ ...prev, [preview.id]: next }));

  return (
    <div
      ref={rootRef}
      className={cx(
        canvas,
        text1,
        "relative flex h-full min-h-[720px] w-full flex-col overflow-hidden",
      )}
    >
      <header className="shrink-0">
        <div className="mx-auto flex h-12 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
          <p className={cx(typeLabel, "min-w-0 flex-1 truncate")}>
            Your brief
          </p>
          <span
            className={cx(
              typeCaption,
              text3,
              "flex shrink-0 items-center gap-2",
            )}
          >
            <span>{selectedModel.name}</span>
            {selectedModel.efforts.length > 0 && (
              <span>
                {
                  EFFORTS.find(
                    (e) =>
                      e.id ===
                      (effort[selectedModel.id] ?? selectedModel.efforts[0]),
                  )?.label
                }
              </span>
            )}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto mt-auto w-full max-w-3xl space-y-5 px-4 py-4 sm:px-6">
          {THREAD.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%]">
                  <p className={userBubble}>{message.text}</p>
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex gap-3">
                <p className={prose}>{message.text}</p>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="shrink-0">
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
          <div className={cx(composer, "p-2")}>
            <textarea
              rows={2}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Reply, or pick a different model below"
              aria-label="Message"
              className={cx(composerInput, "min-h-12")}
            />

            <div className="flex items-center gap-1.5 pt-1">
              <div ref={wrapRef} className="relative">
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => {
                    const index = MODELS.findIndex((m) => m.id === selected);
                    setActive(index === -1 ? 0 : index);
                    setOpen((v) => !v);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  className={cx(ghostButtonMuted, buttonXs)}
                >
                  {selectedModel.name}
                  <HugeiconsIcon
                    icon={open ? ArrowUp01Icon : ArrowDown01Icon}
                    size={12}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </button>

                {open && (
                  <div
                    className={cx(
                      overlayEnter,
                      "absolute bottom-full left-0 z-50 mb-2 flex items-end gap-2",
                    )}
                  >
                    <div
                      ref={listRef}
                      role="listbox"
                      aria-label="Model"
                      aria-activedescendant={`model-${preview.id}`}
                      tabIndex={-1}
                      onKeyDown={onListKeyDown}
                      className={cx(
                        menuPopup,
                        "max-h-[366px] w-[224px] shrink-0",
                      )}
                    >
                      <p className={menuLabel}>Model</p>
                      {MODELS.map((model, index) => (
                        <button
                          key={model.id}
                          id={`model-${model.id}`}
                          type="button"
                          role="option"
                          aria-selected={model.id === selected}
                          data-highlighted={index === active || undefined}
                          tabIndex={-1}
                          onMouseEnter={() => setActive(index)}
                          onFocus={() => setActive(index)}
                          onClick={() => commit(index)}
                          className={cx(menuItem, "pe-8")}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate">{model.name}</span>
                              {model.note && (
                                <span className={cx(badge, badgeNeutral)}>
                                  {model.note}
                                </span>
                              )}
                            </span>
                            <span
                              className={cx(
                                typeCaption,
                                text3,
                                "mt-0.5 block truncate",
                              )}
                            >
                              {model.provider}
                            </span>
                          </span>
                          {model.id === selected && (
                            <HugeiconsIcon
                              icon={Tick02Icon}
                              size={16}
                              strokeWidth={1.8}
                              aria-hidden="true"
                              className="absolute end-2"
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    <div
                      className={cx(
                        frame,
                        overlayShadow,
                        "h-[366px] w-[290px] shrink-0 p-4 max-sm:hidden",
                      )}
                    >
                      <p className={typeLabel}>{preview.name}</p>
                      <p className={cx(typeCaption, text3, "mt-0.5")}>
                        {preview.provider}
                      </p>
                      <p className={cx(typeBodySm, text2, "mt-2")}>
                        {preview.summary}
                      </p>

                      <dl className="mt-3 mb-auto space-y-1">
                        {[
                          {
                            icon: Layers01Icon,
                            label: "Context",
                            value: preview.context,
                          },
                          {
                            icon: DashboardSpeed01Icon,
                            label: "Speed",
                            value: preview.speed,
                          },
                          {
                            icon: Wallet01Icon,
                            label: "Cost",
                            value: preview.cost,
                          },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center gap-2"
                          >
                            <HugeiconsIcon
                              icon={row.icon}
                              size={14}
                              strokeWidth={1.8}
                              aria-hidden="true"
                              className={cx(text3, "shrink-0")}
                            />
                            <dt className={cx(typeCaption, text3)}>
                              {row.label}
                            </dt>
                            <dd className={cx(typeLabelSm, "ml-auto truncate")}>
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <div className={cx(ruleTop, "mt-4 shrink-0 pt-3")}>
                        <div className="flex items-center justify-between gap-2">
                          <p className={cx(typeCaption, text3)}>Reasoning</p>
                          <span
                            className={cx(
                              typeLabelSm,
                              "flex items-center gap-1",
                            )}
                          >
                            <HugeiconsIcon
                              icon={FlashIcon}
                              size={12}
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                            {preview.efforts.length === 0
                              ? "Not supported"
                              : EFFORTS.find((e) => e.id === previewEffort)
                                  ?.label}
                          </span>
                        </div>

                        <div className="mt-2 flex gap-0.5">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span
                              key={i}
                              className={cx(progressTrack, "flex-1")}
                            >
                              <span
                                className={progressFill}
                                style={{
                                  width: i < previewSegments ? "100%" : "0%",
                                }}
                              />
                            </span>
                          ))}
                        </div>

                        {preview.efforts.length === 0 ? (
                          <p className={cx(typeBodySm, text2, "mt-3")}>
                            This model answers directly and has no thinking
                            budget to set.
                          </p>
                        ) : (
                          <>
                            <div
                              role="radiogroup"
                              aria-label="Reasoning effort"
                              className={cx(
                                segmentedTrack,
                                segmentedMd,
                                "mt-3 min-w-full",
                              )}
                            >
                              {EFFORTS.map((option) => {
                                const supported = preview.efforts.includes(
                                  option.id,
                                );
                                const on = previewEffort === option.id;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={on}
                                    disabled={!supported}
                                    onClick={() => setPreviewEffort(option.id)}
                                    className={cx(segmentXs, "flex-1")}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                            <p className={cx(typeBodySm, text2, "mt-2")}>
                              {
                                EFFORTS.find((e) => e.id === previewEffort)
                                  ?.blurb
                              }
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label="Attach a file"
                className={cx(ghostButton, iconButtonSm)}
              >
                <HugeiconsIcon
                  icon={Attachment01Icon}
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                aria-label="Send"
                disabled={value.trim().length === 0}
                className={cx(primaryButton, iconButtonSm, "ml-auto")}
              >
                <HugeiconsIcon
                  icon={ArrowUp02Icon}
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <p className={cx(typeBodySm, text2, "mt-2 text-center")}>
            Not connected yet — nothing you type here is sent anywhere, and no
            answer is generated.
          </p>
        </div>
      </div>
    </div>
  );
}
