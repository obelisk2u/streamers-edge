import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";

/**
 * Example data wired to the stats we discussed:
 * - Chat speed per topic (msgs/min)
 * - Identify "Peak chat spike" (highest msgs/min topic, usually short)
 * - Identify "Top sustained topic" (highest msgs/min among topics with >= 15 min)
 * - Topic share by time
 *
 * Replace these with real API data later.
 */

const activityBars = [24, 40, 32, 56, 72, 50, 90, 64, 48, 36, 58, 44];

type TopicStat = {
  id: number;
  title: string;
  durationMin: number;
  messages: number;
  chatSpeed: number; // msgs/min
};

const topicStats: TopicStat[] = [
  { id: 1, title: "Cozy game recommendations", durationMin: 18.0, messages: 5580, chatSpeed: 310.0 },
  { id: 2, title: "Chat Q&A and shoutouts", durationMin: 14.5, messages: 4495, chatSpeed: 310.0 },
  { id: 3, title: "Weekend plans and life updates", durationMin: 12.0, messages: 3060, chatSpeed: 255.0 },
  { id: 4, title: "Music vibes and playlist picks", durationMin: 16.0, messages: 4320, chatSpeed: 270.0 },
  { id: 5, title: "Creative challenges and art ideas", durationMin: 9.5, messages: 2660, chatSpeed: 280.0 },
  { id: 6, title: "Funny clip recap", durationMin: 11.0, messages: 3850, chatSpeed: 350.0 },
  { id: 7, title: "Streaming setup tips", durationMin: 20.0, messages: 5400, chatSpeed: 270.0 },
  { id: 8, title: "Community events and polls", durationMin: 15.5, messages: 4030, chatSpeed: 260.0 },
];

function fmtInt(n: number) {
  return n.toLocaleString();
}

function fmt1(n: number) {
  return n.toFixed(1);
}

function safeDivide(a: number, b: number) {
  return b === 0 ? 0 : a / b;
}

function computeOverview(stats: TopicStat[]) {
  const totalMessages = stats.reduce((s, t) => s + t.messages, 0);
  const totalTopicMinutes = stats.reduce((s, t) => s + t.durationMin, 0);

  const avgMessagesPerMinuteAcrossTopics = safeDivide(totalMessages, totalTopicMinutes);

  const peak = [...stats].sort((a, b) => b.chatSpeed - a.chatSpeed)[0];

  const sustainedCandidates = stats.filter((t) => t.durationMin >= 15);
  const sustained =
    sustainedCandidates.length > 0
      ? [...sustainedCandidates].sort((a, b) => b.chatSpeed - a.chatSpeed)[0]
      : null;

  const topicShareByTime = stats
    .map((t) => ({
      id: t.id,
      title: t.title,
      share: safeDivide(t.durationMin, totalTopicMinutes) * 100,
      durationMin: t.durationMin,
    }))
    .sort((a, b) => b.share - a.share);

  return {
    totalMessages,
    totalTopicMinutes,
    avgMessagesPerMinuteAcrossTopics,
    peak,
    sustained,
    topicShareByTime,
  };
}

export default function ExampleDashboard() {
  const overview = computeOverview(topicStats);

  const peakMultiple = safeDivide(overview.peak.chatSpeed, overview.avgMessagesPerMinuteAcrossTopics);
  const sustainedMultiple = overview.sustained
    ? safeDivide(overview.sustained.chatSpeed, overview.avgMessagesPerMinuteAcrossTopics)
    : 0;

  const mostTime = overview.topicShareByTime[0];

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Example Report</Badge>
              <Badge variant="outline">Last stream</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Streamers Edge — Chat + Topic Engagement
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              A snapshot of chat momentum and which topics drove the fastest chat.
              “Peak spike” catches short hype moments; “Sustained” highlights what held attention.
            </p>
          </div>

          <a className={buttonVariants({ variant: "outline", size: "lg" })} href="/">
            Back to home
          </a>
        </div>
      </section>

      <Separator />

      {/* Top stats */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total messages" value={fmtInt(overview.totalMessages)} delta="+14% vs last stream" />
          <StatCard title="Topic-time analyzed" value={`${fmt1(overview.totalTopicMinutes)} min`} delta="windowed transcript coverage" />
          <StatCard title="Peak topic chat speed" value={`${fmt1(overview.peak.chatSpeed)} msgs/min`} delta={`Topic ${overview.peak.id}`} />
          <StatCard
            title="Sustained chat speed"
            value={overview.sustained ? `${fmt1(overview.sustained.chatSpeed)} msgs/min` : "—"}
            delta={overview.sustained ? `Topic ${overview.sustained.id} (≥15 min)` : "no sustained topic"}
          />
        </div>
      </section>

      {/* KEY LAYOUT CHANGE:
          2-col grid where LEFT col is a vertical stack (timeline + insight cards),
          RIGHT col is the tall topic-share card. This fills the “dead space”. */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          {/* LEFT COLUMN STACK */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chat activity timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-44 items-end gap-2">
                  {activityBars.map((value, index) => (
                    <div
                      key={`bar-${index}`}
                      className="flex-1 rounded-md bg-primary/60"
                      style={{ height: `${value}%` }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>0:00</span>
                  <span>1:00</span>
                  <span>2:00</span>
                  <span>3:00</span>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Baseline (topic-time):{" "}
                  <span className="text-foreground">
                    {fmt1(overview.avgMessagesPerMinuteAcrossTopics)} msgs/min
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* These used to be below in their own full-width section.
                Now they live under the timeline, filling the left-side whitespace. */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Peak chat spike</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Topic {overview.peak.id} — {overview.peak.title} •{" "}
                    {fmt1(overview.peak.chatSpeed)} msgs/min over {fmt1(overview.peak.durationMin)} min (
                    {fmt1(peakMultiple)}x baseline).
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Often a short hype moment; not always repeatable.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top sustained topic</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {overview.sustained ? (
                      <>
                        Topic {overview.sustained.id} — {overview.sustained.title} •{" "}
                        {fmt1(overview.sustained.chatSpeed)} msgs/min over {fmt1(overview.sustained.durationMin)} min (
                        {fmt1(sustainedMultiple)}x baseline).
                      </>
                    ) : (
                      <>No sustained topic found (try lowering the sustained threshold).</>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Better signal for content that holds attention.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most time spent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Topic {mostTime.id} — {mostTime.title} • {fmt1(mostTime.share)}% of topic-time (
                    {fmt1(mostTime.durationMin)} min).
                  </div>
                  <div className="text-xs text-muted-foreground">
                    This is what dominated the stream by minutes.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <Card className="self-start">
            <CardHeader>
              <CardTitle>Topic share by time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.topicShareByTime.slice(0, 10).map((t) => {
                const pct0 = Math.max(0, Math.min(100, t.share));
                const pct = `${pct0.toFixed(0)}%`;
                return (
                  <div key={t.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate pr-3">
                        #{t.id} {t.title}
                      </span>
                      <span className="text-muted-foreground">{pct}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: pct }} />
                    </div>
                    <div className="text-xs text-muted-foreground">{fmt1(t.durationMin)} min</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Table: chat speed per topic */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Card>
          <CardHeader>
            <CardTitle>Chat speed per topic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3 text-left font-medium">Topic</th>
                    <th className="py-3 text-left font-medium">Title</th>
                    <th className="py-3 text-right font-medium">Msgs</th>
                    <th className="py-3 text-right font-medium">Minutes</th>
                    <th className="py-3 text-right font-medium">Msgs/min</th>
                    <th className="py-3 text-right font-medium">vs baseline</th>
                    <th className="py-3 text-right font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {[...topicStats]
                    .sort((a, b) => b.chatSpeed - a.chatSpeed)
                    .slice(0, 12)
                    .map((t) => {
                      const mult = safeDivide(t.chatSpeed, overview.avgMessagesPerMinuteAcrossTopics);
                      const type = t.durationMin >= 15 ? "Sustained" : "Spike";
                      return (
                        <tr key={t.id} className="border-b">
                          <td className="py-3">{t.id}</td>
                          <td className="py-3 max-w-[520px]">
                            <span className="truncate block">{t.title}</span>
                          </td>
                          <td className="py-3 text-right">{fmtInt(t.messages)}</td>
                          <td className="py-3 text-right">{fmt1(t.durationMin)}</td>
                          <td className="py-3 text-right">{fmt1(t.chatSpeed)}</td>
                          <td className="py-3 text-right">{fmt1(mult)}x</td>
                          <td className="py-3 text-right">
                            <Badge variant={type === "Sustained" ? "secondary" : "outline"}>
                              {type}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              “Spike” topics are short bursts. “Sustained” topics (≥15 min) are better signals of repeatable engagement.
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  delta,
}: {
  title: string;
  value: string;
  delta: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{delta}</div>
      </CardContent>
    </Card>
  );
}