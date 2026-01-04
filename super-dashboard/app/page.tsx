import { readFile } from "node:fs/promises";
import path from "node:path";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SentimentLineChart } from "@/components/sentiment-line-chart";
import { ModeratorSentimentCard } from "@/components/moderator-sentiment-card";
import { StreamExtremesCard } from "@/components/stream-extremes-card";
import { SentimentBarChart } from "@/components/sentiment-bar-chart";

const DATA_DIR = path.join(process.cwd(), "public", "data");

async function loadJson<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function formatSigned(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
}

export default async function Page() {
  const [
    mostNegativeUsers,
    mostPositiveUsers,
    sentimentBins,
    topMentions,
    moderatorSentiment,
    streamExtremes,
    chatCount,
    sentimentCounts,
  ] = await Promise.all([
    loadJson<
      Array<{
        username: string;
        count: number;
        avg_sentiment: number;
        messages: string[];
      }>
    >("most_negative_users.json"),
    loadJson<
      Array<{
        username: string;
        count: number;
        avg_sentiment: number;
        messages: string[];
      }>
    >("most_positive_users.json"),
    loadJson<{
      stream_count: number;
      bins: Array<{ label: string; avg_sentiment: number; count: number }>;
    }>("sentiment_bins_5pct.json"),
    loadJson<{ username: string; mentions: number; messages: string[] }>(
      "top_supertf_mentions.json"
    ),
    loadJson<
      Array<{
        username: string;
        positive: Array<{
          username: string;
          message: string;
          label: string;
          score: number;
        }>;
        negative: Array<{
          username: string;
          message: string;
          label: string;
        score: number;
        }>;
      }>
    >("moderator_sentiment.json"),
    loadJson<
      Array<{
        stream: string;
        started_at?: string | null;
        ended_at?: string | null;
        most_positive: {
          username: string;
          message: string;
          label: string;
          score: number;
          timestamp_utc?: string | null;
        } | null;
        most_negative: {
          username: string;
          message: string;
          label: string;
          score: number;
          timestamp_utc?: string | null;
        } | null;
      }>
    >("stream_extreme_sentiment.json"),
    loadJson<{ count: number }>("chat_count.json"),
    loadJson<{ negative: number; neutral: number; positive: number }>(
      "sentiment_counts.json"
    ),
  ]);

  const totalScoredChats = sentimentBins.bins.reduce(
    (sum, bin) => sum + bin.count,
    0
  );
  const totalChats = chatCount.count;
  const weightedSentiment = sentimentBins.bins.reduce(
    (sum, bin) => sum + bin.avg_sentiment * bin.count,
    0
  );
  const avgSentiment = totalScoredChats
    ? weightedSentiment / totalScoredChats
    : 0;
  const topNegative = mostNegativeUsers[0];
  const topPositive = mostPositiveUsers[0];

  const kpis = [
    {
      label: "Average Chat Sentiment",
      value: formatSigned(avgSentiment),
      tone: "Sentiment scored between -1 and 1",
    },
    {
      label: "Chats Scored",
      value: "1,233,169",
      tone: "Total messages scored",
    },
    {
      label: "Most Positive Avg",
      value: topPositive
        ? `@${topPositive.username}`
        : "No data",
      tone: topPositive
        ? `${formatSigned(topPositive.avg_sentiment)} avg`
        : "—",
      detail: topPositive ? `${topPositive.count} chats` : "—",
    },
    {
      label: "Most Negative Avg",
      value: topNegative
        ? `@${topNegative.username}`
        : "No data",
      tone: topNegative
        ? `${formatSigned(topNegative.avg_sentiment)} avg`
        : "—",
      detail: topNegative ? `${topNegative.count} chats` : "—",
    },
  ];


  return (
    <main className="relative min-h-screen bg-[#f7f2ea] text-foreground">
      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#ffbc7a]/40 blur-[90px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-[#8bb7ff]/40 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#92f2c8]/40 blur-[120px]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="sticky top-0 z-40 -mx-6 flex flex-col gap-4 bg-[#f7f2ea]/95 px-6 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Streamer's Edge • NLP & Sentiment
              </p>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Posi Vibes Dashboard - Chat
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Dashboard for sentiment analysis and
                engagement statistics.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white/80 p-1 text-xs">
                <Link
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "h-7 px-3"
                  )}
                  href="/"
                >
                  Chat
                </Link>
                {/*
                <Link
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-7 px-3"
                  )}
                  href="/fun"
                >
                  Fun Stats
                </Link>
                */}
                <Link
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-7 px-3"
                  )}
                  href="/streamer"
                >
                  Streamer
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="bg-white/70 backdrop-blur">
              <CardHeader>
                <CardDescription>{kpi.label}</CardDescription>
                <CardTitle className="text-2xl">{kpi.value}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{kpi.tone}</Badge>
                  <span className="text-muted-foreground">{kpi.detail}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        

        <section>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Chat Sentiment Over Stream</CardTitle>
              <CardDescription>
                Average chat sentiment per 5% stream segment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-black/5 bg-white px-4 py-4">
                <div className="h-56 w-full">
                  <SentimentLineChart bins={sentimentBins.bins} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {sentimentBins.stream_count} streams aggregated
                </span>
                <Badge variant="secondary">
                  Avg {formatSigned(avgSentiment)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Sentiment Mix</CardTitle>
              <CardDescription>
                Count of negative, neutral, and positive chats greater than 10 words
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 w-full">
                <SentimentBarChart counts={sentimentCounts} />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Most Positive Users</CardTitle>
              <CardDescription>
                Highest average sentiment for users with 5+ chats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mostPositiveUsers.slice(0, 5).map((user, index) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between rounded-lg border border-black/5 bg-white px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {index + 1}. @{user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.count} chats • {formatSigned(user.avg_sentiment)} avg
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button size="sm" variant="outline" />}
                    >
                      View
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>@{user.username}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {user.count} chats •{" "}
                          {formatSigned(user.avg_sentiment)} average sentiment
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-black/5 bg-white p-3 text-sm">
                        <div className="space-y-2">
                          {user.messages.map((message, messageIndex) => (
                            <p key={`${messageIndex}-${message}`}>{message}</p>
                          ))}
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Most Negative Users</CardTitle>
              <CardDescription>
                Lowest average sentiment for users with 5+ chats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mostNegativeUsers.slice(0, 5).map((user, index) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between rounded-lg border border-black/5 bg-white px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {index + 1}. @{user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.count} chats • {formatSigned(user.avg_sentiment)} avg
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button size="sm" variant="outline" />}
                    >
                      View
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>@{user.username}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {user.count} chats •{" "}
                          {formatSigned(user.avg_sentiment)} average sentiment
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-black/5 bg-white p-3 text-sm">
                        <div className="space-y-2">
                          {user.messages.map((message, messageIndex) => (
                            <p key={`${messageIndex}-${message}`}>{message}</p>
                          ))}
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <ModeratorSentimentCard data={moderatorSentiment} />
        </section>

        <section>
          <StreamExtremesCard data={streamExtremes} />
        </section>
      </div>
    </main>
  );
}
