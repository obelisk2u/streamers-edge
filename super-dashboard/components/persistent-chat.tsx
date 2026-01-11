"use client";

import { useEffect, useState } from "react";

import { ChatReplay } from "@/components/chat-replay";

type EmoteEntry = {
  code: string;
  url: string;
  provider: "bttv" | "7tv" | "twitch";
};

type EmoteData = {
  emotes: EmoteEntry[];
};

export function PersistentChat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [emotes, setEmotes] = useState<EmoteEntry[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [messagesResponse, emotesResponse] = await Promise.all([
          fetch("/data/gen.json"),
          fetch("/data/emotes.json"),
        ]);

        if (messagesResponse.ok) {
          const data = (await messagesResponse.json()) as string[];
          if (active) {
            setMessages(data);
          }
        }

        if (emotesResponse.ok) {
          const data = (await emotesResponse.json()) as EmoteData;
          if (active) {
            setEmotes(data.emotes ?? []);
          }
        }
      } catch {
        if (active) {
          setMessages([]);
          setEmotes([]);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return <ChatReplay messages={messages} emotes={emotes} />;
}
