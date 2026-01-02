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
  AlertDialogMedia,
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
import { GithubIcon } from "lucide-react";
import { SentimentLineChart } from "@/components/sentiment-line-chart";
import { ModeratorSentimentCard } from "@/components/moderator-sentiment-card";
import { StreamExtremesCard } from "@/components/stream-extremes-card";

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
    chatterDistribution,
    mostNegativeUsers,
    mostPositiveUsers,
    sentimentBins,
    topMentions,
    moderatorSentiment,
    streamExtremes,
    streamMetadata,
  ] = await Promise.all([
    loadJson<Array<{ label: string; chatters: number; percent: number }>>(
      "chatter_distribution.json"
    ),
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
    loadJson<
      Array<{
        stream: string;
        date?: string | null;
        title?: string | null;
        category?: string | null;
      }>
    >("stream_metadata.json"),
  ]);

  const streamMetadataById = Object.fromEntries(
    streamMetadata.map((entry) => [entry.stream, entry])
  );

  const totalChats = sentimentBins.bins.reduce(
    (sum, bin) => sum + bin.count,
    0
  );
  const weightedSentiment = sentimentBins.bins.reduce(
    (sum, bin) => sum + bin.avg_sentiment * bin.count,
    0
  );
  const avgSentiment = totalChats ? weightedSentiment / totalChats : 0;
  const topNegative = mostNegativeUsers[0];
  const topPositive = mostPositiveUsers[0];

  const kpis = [
    {
      label: "Average Sentiment",
      value: formatSigned(avgSentiment),
      tone: avgSentiment >= 0 ? "Positive tilt" : "Negative tilt",
      detail: `${totalChats.toLocaleString()} chats scored`,
    },
    {
      label: "Biggest Fan",
      value: `@${topMentions.username}`,
      tone: `${topMentions.mentions} mentions`,
      detail: `${topMentions.messages.length} mention messages`,
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
    <main className="relative min-h-screen overflow-hidden bg-[#f7f2ea] text-foreground">
      <div className="fixed right-4 top-4 z-50 w-72">
        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-medium">Please help me get a job</p>
            <p className="text-muted-foreground">
              Star my projects on{" "}
              <a
                className="underline underline-offset-4"
                href="https://github.com/obelisk2u"
                target="_blank"
                rel="noreferrer"
              >
                github.com/obelisk2u
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#ffbc7a]/40 blur-[90px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-[#8bb7ff]/40 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#92f2c8]/40 blur-[120px]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Streamer Edge • NLP & Sentiment
              </p>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Posi Vibes Dashboard
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Dashboard for sentiment analysis and
                engagement statistics.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AlertDialog>
                <AlertDialogTrigger render={<Button className="h-9" />}>
                  <GithubIcon data-icon="inline-start" />
                  GitHub
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-black text-white">
                      <GithubIcon />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Visit my GitHub</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will not download anything. It simply opens my
                      profile page on GitHub.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                    <a
                      className={cn(buttonVariants({ variant: "secondary" }))}
                      href="https://github.com/obelisk2u"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open GitHub
                    </a>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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

        

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
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
              <CardTitle>Sentiment Over Stream</CardTitle>
              <CardDescription>
                Average sentiment per 5% stream segment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-black/5 bg-white px-4 py-4">
                <div className="h-48 w-full">
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
          <StreamExtremesCard
            data={streamExtremes}
            metadata={streamMetadataById}
          />
        </section>

        <section>
          <ModeratorSentimentCard data={moderatorSentiment} />
        </section>
      </div>
    </main>
  );
}
