import { readFile } from "node:fs/promises";
import path from "node:path";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChristmasMentionsChart } from "@/components/christmas-mentions-chart";
import { BitsOverTimeChart } from "@/components/bits-over-time-chart";
import { SubsOverTimeChart } from "@/components/subs-over-time-chart";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DATA_DIR = path.join(process.cwd(), "public", "data");

async function loadJson<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export default async function Page() {
  const chatterDistribution = await loadJson<
    Array<{ label: string; chatters: number; percent: number }>
  >("chatter_distribution.json");
  const christmasMentions = await loadJson<
    Array<{
      date: string;
      christmas: number;
      new_years: number;
      super: number;
      blizzard: number;
    }>
  >("christmas_mentions.json");
  const topMentionPair = await loadJson<{
    pair: string[];
    mentions: number;
    messages: Array<{
      sender: string;
      target: string;
      message: string;
      timestamp?: string | null;
    }>;
  }>("top_mention_pairs.json");
  const subsOverTime = await loadJson<Array<{ date: string; subs: number }>>(
    "subs_over_time.json"
  );
  const bitsOverTime = await loadJson<Array<{ date: string; bits: number }>>(
    "bits_over_time.json"
  );
  const funStats = await loadJson<{
    unique_chatters: number;
    avg_chats_per_minute: number;
    peak_messages_per_second: number;
    avg_stream_length_seconds: number;
  }>("fun_stats.json");
  const longestMessage = await loadJson<{
    stream_id: string;
    timestamp: string;
    username: string;
    message: string;
    words: number;
  }>("longest_message.json");

  const chartStart = "2025-12-15";
  const filteredMentions = christmasMentions.filter(
    (entry) => entry.date >= chartStart
  );
  const filteredSubs = subsOverTime.filter(
    (entry) => entry.date >= chartStart
  );
  const filteredBits = bitsOverTime.filter(
    (entry) => entry.date >= chartStart
  );

  const avgHours = Math.floor(funStats.avg_stream_length_seconds / 3600);
  const avgMinutes = Math.floor(
    (funStats.avg_stream_length_seconds % 3600) / 60
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f2ea] text-foreground">
      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#ffbc7a]/40 blur-[90px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-[#8bb7ff]/40 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#92f2c8]/40 blur-[120px]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Streamer's Edge • Fun Stats
              </p>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Fun Stats
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                This tab is intentionally empty for now.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white/80 p-1 text-xs">
                <Link
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-7 px-3"
                  )}
                  href="/"
                >
                  Posi Vibes
                </Link>
                <Link
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "h-7 px-3"
                  )}
                  href="/fun"
                >
                  Fun Stats
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Unique Chatters",
              value: funStats.unique_chatters.toLocaleString(),
              detail: "Across 30 streams",
            },
            {
              label: "Avg Chats / Minute",
              value: funStats.avg_chats_per_minute.toLocaleString(),
              detail: "Messages per minute",
            },
            {
              label: "Peak Messages / Second",
              value: funStats.peak_messages_per_second.toLocaleString(),
              detail: "Highest burst: GOTY Announced",
            },
            {
              label: "Avg Stream Length",
              value: `${avgHours}h ${avgMinutes}m`,
              detail: "Across 30 streams",
            },
          ].map((card) => (
            <Card key={card.label} className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-2xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.detail}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Chatter Distribution</CardTitle>
              <CardDescription>
                What percentage of chatters fall into each message volume band.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {chatterDistribution.map((band) => (
                <div key={band.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{band.label}</span>
                    <span className="text-muted-foreground">
                      {band.percent}% • {band.chatters} chatters
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7ab7ff] via-[#8ad1ff] to-[#a9ffe2]"
                      style={{ width: `${band.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Holiday + Brand Mentions</CardTitle>
              <CardDescription>
                Daily mentions of christmas, new years, @supertf, and blizzard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ChristmasMentionsChart data={filteredMentions} />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Bits Over Time</CardTitle>
              <CardDescription>
                Daily bits cheered in chat (e.g. Cheer100).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <BitsOverTimeChart data={filteredBits} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Longest Message</CardTitle>
              <CardDescription>
                Longest single chat message across the 30-day window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/5 bg-white px-3 py-2">
                <div>
                  <p className="font-medium">@{longestMessage.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {longestMessage.words} words •{" "}
                    {longestMessage.timestamp
                      ? new Date(longestMessage.timestamp).toLocaleString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          }
                        )
                      : "Date unknown"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  VOD ID: {longestMessage.stream_id}
                </span>
              </div>
              <div className="rounded-lg border border-black/5 bg-white p-3">
                <p className="text-sm text-foreground">
                  {longestMessage.message}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Top @ Pair</CardTitle>
              <CardDescription>
                People who @ each other the most across the chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-xl border border-black/5 bg-white px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium">
                    @{topMentionPair.pair[0]}
                  </span>
                  <span className="text-muted-foreground">↔</span>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium">
                    @{topMentionPair.pair[1]}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {topMentionPair.mentions} mention exchanges
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tap for the full back-and-forth thread.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <button
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      />
                    }
                  >
                    Read more
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        @{topMentionPair.pair[0]} ↔ @{topMentionPair.pair[1]}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {topMentionPair.messages.length} messages where they @
                        each other.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-64 space-y-3 overflow-y-auto">
                      {topMentionPair.messages.map((entry, index) => (
                        <div
                          key={`${index}-${entry.message}`}
                          className="rounded-lg border border-black/5 bg-white p-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              @{entry.sender}
                            </span>
                            <span>→</span>
                            <span className="font-medium text-foreground">
                              @{entry.target}
                            </span>
                            {entry.timestamp ? (
                              <span className="ml-auto">
                                {new Date(entry.timestamp).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm">{entry.message}</p>
                        </div>
                      ))}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Subs Over Time</CardTitle>
              <CardDescription>
                Daily Tier 1-3, Prime, and gifted subs in chat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <SubsOverTimeChart data={filteredSubs} />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
