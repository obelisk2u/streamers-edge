"use client";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function StreamExtremesCard({ data }: StreamExtremesCardProps) {
  const [index, setIndex] = useState(0);
  const total = data.length;
  const active = useMemo(
    () => (total ? data[Math.min(index, total - 1)] : null),
    [data, index, total]
  );

  useEffect(() => {
    if (index > 0 && index >= total) {
      setIndex(0);
    }
  }, [index, total]);

  const goPrev = () => {
    if (!total) return;
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    if (!total) return;
    setIndex((prev) => (prev + 1) % total);
  };

  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Stream Extreme Sentiment</CardTitle>
            <CardDescription>
              Long-form chat highlights (20+ words) with the most positive and most
              negative sentiment per stream.
            </CardDescription>
          </div>
          {total > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                aria-label="Previous stream"
              >
                ←
              </Button>
              <span className="text-xs text-muted-foreground">
                {index + 1} / {total}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goNext}
                aria-label="Next stream"
              >
                →
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="h-[520px] space-y-6">
        {active ? (
          <div className="h-full overflow-y-auto rounded-xl border border-black/5 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  VOD ID: {active.stream}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(active.started_at)} — {formatDate(active.ended_at)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-black/5 bg-white p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Most Positive</p>
                  <Badge variant="secondary">
                    {active.most_positive
                      ? active.most_positive.score.toFixed(3)
                      : "n/a"}
                  </Badge>
                </div>
                {active.most_positive ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      @{active.most_positive.username}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {active.most_positive.message}
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
                    {active.most_negative
                      ? active.most_negative.score.toFixed(3)
                      : "n/a"}
                  </Badge>
                </div>
                {active.most_negative ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      @{active.most_negative.username}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {active.most_negative.message}
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
        ) : (
          <p className="text-sm text-muted-foreground">
            No stream data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
