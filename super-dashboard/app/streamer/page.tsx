import { readFile } from "node:fs/promises";
import path from "node:path";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SentimentLineChart } from "@/components/sentiment-line-chart";
import { SentimentBarChart } from "@/components/sentiment-bar-chart";

const ANALYSIS_DIR = path.join(
  process.cwd(),
  "..",
  "analysis",
  "data",
  "processed"
);
const PUBLIC_DIR = path.join(process.cwd(), "public", "data");

async function loadJsonFrom(dir: string, filename: string) {
  const filePath = path.join(dir, filename);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function loadJsonFromSafe<T>(dir: string, filename: string, fallback: T) {
  try {
    return (await loadJsonFrom(dir, filename)) as T;
  } catch {
    return fallback;
  }
}

function formatHoursMinutes(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatSigned(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
}

export default async function Page() {
  const [
    avgSentiment,
    transcripts,
    extremes,
    sentimentBins,
    chatBins,
    sentenceCounts,
    swearCounts,
  ] = await Promise.all([
    loadJsonFromSafe(
      ANALYSIS_DIR,
      "transcript_avg_sentiment.json",
      {
        avg_sentiment: 0,
        total_sentences: 0,
        total_streams: 0,
      }
    ),
    loadJsonFromSafe<
      Array<{
        vod_id: string;
        transcript?: { duration?: number };
      }>
    >(ANALYSIS_DIR, "combined_transcripts_sentences.json", []),
    loadJsonFromSafe(PUBLIC_DIR, "transcript_sentence_extremes.json", {
      positive: [],
      negative: [],
    }),
    loadJsonFromSafe(ANALYSIS_DIR, "transcript_sentiment_bins_5pct.json", {
      stream_count: 0,
      bins: [],
    }),
    loadJsonFromSafe(PUBLIC_DIR, "sentiment_bins_5pct.json", { bins: [] }),
    loadJsonFromSafe(PUBLIC_DIR, "transcript_sentence_counts.json", {
      negative: 0,
      neutral: 0,
      positive: 0,
    }),
    loadJsonFromSafe(ANALYSIS_DIR, "streamer_swear_counts.json", {
      fuck: 0,
      shit: 0,
      ass: 0,
      hell: 0,
    }),
  ]);

  const totalStreamSeconds = transcripts.reduce((sum, entry) => {
    const duration = entry.transcript?.duration ?? 0;
    return sum + (Number.isFinite(duration) ? duration : 0);
  }, 0);

  const topPositive = extremes.positive ?? [];
  const topNegative = extremes.negative ?? [];

  const chatTotal = chatBins.bins.reduce((sum, bin) => sum + bin.count, 0);
  const chatWeighted = chatBins.bins.reduce(
    (sum, bin) => sum + bin.avg_sentiment * bin.count,
    0
  );
  const chatAvg = chatTotal ? chatWeighted / chatTotal : 0;
  const delta = avgSentiment.avg_sentiment - chatAvg;
  const percentChange = chatAvg ? (delta / Math.abs(chatAvg)) * 100 : 0;

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
                Streamer&apos;s Edge • Streamer Analysis
              </p>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Posi Vibes Dashboard - super
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Streamer topics and conversation themes.
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
                    buttonVariants({ variant: "secondary", size: "sm" }),
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
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardDescription>Average Sentiment</CardDescription>
              <CardTitle className="text-2xl">
                {avgSentiment.avg_sentiment.toFixed(3)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Delta vs chat avg:</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  {formatSigned(percentChange)}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardDescription>Total Sentences</CardDescription>
              <CardTitle className="text-2xl">
                {avgSentiment.total_sentences.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Scored transcript sentences
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardDescription>Total Stream Time</CardDescription>
              <CardTitle className="text-2xl">
                {formatHoursMinutes(totalStreamSeconds)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Sum of transcript durations
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardDescription>Total Streams</CardDescription>
              <CardTitle className="text-2xl">
                {avgSentiment.total_streams.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Unique VODs processed
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardDescription>“Fuck” Count</CardDescription>
              <CardTitle className="text-2xl">
                {swearCounts.fuck.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardDescription>“Shit” Count</CardDescription>
              <CardTitle className="text-2xl">
                {swearCounts.shit.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardDescription>“Ass” Count</CardDescription>
              <CardTitle className="text-2xl">
                {swearCounts.ass.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardDescription>“Hell” Count</CardDescription>
              <CardTitle className="text-2xl">
                {swearCounts.hell.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Sentiment Over Stream</CardTitle>
              <CardDescription>
                Average sentence sentiment per 5% stream segment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-black/5 bg-white px-4 py-4">
                <div className="h-64 w-full">
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
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Sentiment Mix</CardTitle>
              <CardDescription>
                Count of negative, neutral, and positive transcript sentences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 w-full">
                <SentimentBarChart counts={sentenceCounts} />
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Top Sentences by Sentiment</CardTitle>
              <CardDescription>
                Highest-scoring positive and negative transcript sentences.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Top Positive</p>
                </div>
                <div className="space-y-3">
                  {topPositive.map((item, index) => (
                    <div
                      key={`pos-${index}-${item.vod_id}`}
                      className="rounded-lg border border-black/5 bg-white p-3 text-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>VOD {item.vod_id}</span>
                        <span>{item.score.toFixed(3)}</span>
                      </div>
                      <p className="mt-2 text-sm">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Top Negative</p>
                </div>
                <div className="space-y-3">
                  {topNegative.map((item, index) => (
                    <div
                      key={`neg-${index}-${item.vod_id}`}
                      className="rounded-lg border border-black/5 bg-white p-3 text-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>VOD {item.vod_id}</span>
                        <span>{item.score.toFixed(3)}</span>
                      </div>
                      <p className="mt-2 text-sm">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
