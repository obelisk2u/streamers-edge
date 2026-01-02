"use client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ExtremeMessage = {
  username: string;
  message: string;
  timestamp_utc?: string | null;
  label: string;
  score: number;
};

type StreamExtreme = {
  stream: string;
  started_at?: string | null;
  ended_at?: string | null;
  most_positive: ExtremeMessage | null;
  most_negative: ExtremeMessage | null;
};

type StreamExtremesCardProps = {
  data: StreamExtreme[];
  metadata?: Record<
    string,
    { title?: string | null; date?: string | null; category?: string | null }
  >;
};

function formatDate(value?: string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

function formatStreamDate(streamId: string) {
  const raw = streamId.replace("stream=", "");
  const [datePart, timePart] = raw.split("T");
  if (!datePart || !timePart) {
    return streamId;
  }
  const normalizedTime = timePart.replace(/-(?=\d{2})/g, ":");
  const parsed = new Date(`${datePart}T${normalizedTime}`);
  if (Number.isNaN(parsed.getTime())) {
    return streamId;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

export function StreamExtremesCard({ data, metadata }: StreamExtremesCardProps) {
  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Stream Extreme Sentiment</CardTitle>
        <CardDescription>
          Long-form chat highlights (20+ words) with the most positive and most
          negative sentiment per stream.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.length ? (
          <div className="space-y-5">
            {data.map((entry) => {
              const meta = metadata?.[entry.stream];
              return (
                <div
                  key={entry.stream}
                  className="rounded-xl border border-black/5 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {meta?.title || formatStreamDate(entry.stream)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.started_at)} —{" "}
                        {formatDate(entry.ended_at)}
                      </p>
                      {meta?.category ? (
                        <p className="text-xs text-muted-foreground">
                          {meta.category}
                        </p>
                      ) : null}
                    </div>
                  </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-lg border border-black/5 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Most Positive</p>
                      <Badge variant="secondary">
                        {entry.most_positive
                          ? entry.most_positive.score.toFixed(3)
                          : "n/a"}
                      </Badge>
                    </div>
                    {entry.most_positive ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          @{entry.most_positive.username}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {entry.most_positive.message}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No positive message found for this stream.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 rounded-lg border border-black/5 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Most Negative</p>
                      <Badge className="bg-[#ff5f56] text-white">
                        {entry.most_negative
                          ? entry.most_negative.score.toFixed(3)
                          : "n/a"}
                      </Badge>
                    </div>
                    {entry.most_negative ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          @{entry.most_negative.username}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {entry.most_negative.message}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No negative message found for this stream.
                      </p>
                    )}
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No stream data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
