"use client";

import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Cta } from "./cta";

const AiChat = dynamic(() => import("@/components/ai-chat-9"), {
  ssr: false,
  loading: () => (
    <div className="stage-skeleton" role="status" aria-live="polite">
      <span className="kicker">Loading composer</span>
    </div>
  ),
});

/**
 * The fullscreen conversation, opened by the first message sent from the hero.
 *
 * NOT WIRED, and deliberately honest about it. Two separate reasons:
 *
 *  1. There is no assistant. The backend contract lives in ../../chat-reference
 *     (POST /api/chatbot, needs OPENAI_API_KEY and a Node runtime). Nothing is
 *     sent anywhere, so no reply is shown and none is faked.
 *  2. ai-chat-9 takes no props and owns its own input state, so it is mounted
 *     here as the composer only. What is typed into it cannot reach this thread
 *     and the opening message cannot be seeded into it. Giving it `value` and
 *     `onSubmit` is the change that joins the two.
 */
export function Chat({ first, onClose }: { first: string; onClose: () => void }) {
  // Escape closes, and the page behind must not scroll under the overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="chat" role="dialog" aria-modal="true" aria-label="Your brief">
      <div className="chat-bar">
        <span className="kicker">Your brief</span>
        {/* D06: every modal has a visible, working close. */}
        <Cta variant="icon" underline label="Close" onActivate={onClose}>
          <X className="glyph" aria-hidden="true" />
        </Cta>
      </div>

      <div className="chat-thread">
        <article className="chat-turn chat-turn--you">
          <span className="kicker">You</span>
          <p>{first}</p>
        </article>

        <article className="chat-turn chat-turn--us">
          <span className="kicker">Talkerstein</span>
          <p className="muted">
            Nothing has been sent. The assistant is not connected yet, so this
            is where its answer will appear — your message is held on this page
            only.
          </p>
        </article>
      </div>

      <div className="chat-composer">
        <AiChat />
      </div>
    </div>
  );
}
