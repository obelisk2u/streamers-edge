"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ChatReplayProps = {
  messages: string[];
  emotes: Array<{
    code: string;
    url: string;
    provider: "bttv" | "7tv" | "twitch";
  }>;
};

const TICK_MS =3000;

export function ChatReplay({ messages, emotes }: ChatReplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feed, setFeed] = useState<string[]>([]);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const orderRef = useRef<number[]>([]);
  const emoteMap = useMemo(
    () => new Map(emotes.map((emote) => [emote.code, emote])),
    [emotes]
  );

  function shuffleOrder(length: number) {
    const order = Array.from({ length }, (_, index) => index);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  function cleanMessage(message: string) {
    const tokens = message.trim().split(/\s+/);
    while (tokens.length) {
      const last = tokens[tokens.length - 1];
      const isSingleChar = last.length === 1;
      const isBarePunct = /^[^\w]+$/.test(last);
      if (isSingleChar || isBarePunct) {
        tokens.pop();
        continue;
      }
      break;
    }
    return tokens.join(" ");
  }

  useEffect(() => {
    if (!messages.length) {
      orderRef.current = [];
      setFeed([]);
      setCurrentIndex(0);
      return;
    }

    orderRef.current = shuffleOrder(messages.length);
    setFeed([]);
    setCurrentIndex(0);
  }, [messages]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const order = orderRef.current;
        if (!order.length) {
          return 0;
        }

        if (prev + 1 >= order.length) {
          orderRef.current = shuffleOrder(messages.length);
          return 0;
        }

        return prev + 1;
      });
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [messages]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const order = orderRef.current;
    const nextMessage =
      order.length && order[currentIndex] !== undefined
        ? cleanMessage(messages[order[currentIndex]])
        : "";
    setFeed((prev) => {
      const next = [...prev, nextMessage];
      return messages.length ? next.slice(-messages.length) : next;
    });
  }, [currentIndex, messages]);

  useEffect(() => {
    if (!isPinnedToBottom) {
      return;
    }

    const container = feedRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [feed, isPinnedToBottom]);

  function handleScroll() {
    const container = feedRef.current;
    if (!container) {
      return;
    }

    const threshold = 16;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      threshold;
    setIsPinnedToBottom(isAtBottom);
  }

  function renderMessage(message: string) {
    return message.split(/(\s+)/).map((token, index) => {
      if (!token.trim()) {
        return token;
      }

      const exact = emoteMap.get(token);
      if (exact) {
        return (
          <img
            key={`emote-${index}`}
            src={exact.url}
            alt={exact.code}
            title={`${exact.code} • ${exact.provider.toUpperCase()}`}
            className="inline-block h-6 w-6 align-[-0.2em]"
            loading="lazy"
          />
        );
      }

      const punctMatch = token.match(
        /^([("'[{<]*)(.+?)([)"'\]}>,.!?;:]*?)$/
      );
      if (punctMatch) {
        const [, leading, core, trailing] = punctMatch;
        const withPunct = emoteMap.get(core);
        if (withPunct) {
          return (
            <span key={`emote-${index}`} className="inline-flex items-center">
              {leading}
              <img
                src={withPunct.url}
                alt={withPunct.code}
                title={`${withPunct.code} • ${withPunct.provider.toUpperCase()}`}
                className="inline-block h-6 w-6 align-[-0.2em]"
                loading="lazy"
              />
              {trailing}
            </span>
          );
        }
      }

      return token;
    });
  }

  return (
    <div className="w-full rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Generated Chat
          </p>
          <AlertDialog>
            <AlertDialogTrigger className="h-7 rounded-md px-2 text-[8px] uppercase tracking-[0.2em] text-muted-foreground transition hover:bg-muted hover:text-foreground">
              Disclaimer
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle></AlertDialogTitle>
                <AlertDialogDescription>
                  Messages are produced by a language model trained on supertf chat messages. Not my views. <br/><br/>Nerd: It's a LoRA-fine-tuned Phi-3-mini model. I know it's shit. I'm looking into a neural tpp hybrid rendition or a different training objective.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end">
                <AlertDialogCancel>Got it</AlertDialogCancel>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {!isPinnedToBottom ? (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
            Scrolling back
          </span>
        ) : null}
      </div>
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-2 text-sm"
      >
        {feed.length ? (
          feed.map((message, index) => (
            <div
              key={`${message}-${index}`}
              className={
                index === feed.length - 1
                  ? "rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 font-medium text-emerald-900"
                  : "rounded-xl border border-black/5 bg-white px-3 py-2 text-muted-foreground"
              }
            >
              {renderMessage(message)}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        )}
      </div>
    </div>
  );
}
