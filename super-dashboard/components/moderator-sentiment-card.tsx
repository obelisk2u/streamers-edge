"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ModeratorMessage = {
  message: string;
  score: number;
  label?: string;
  timestamp_utc?: string | null;
};

type ModeratorEntry = {
  username: string;
  positive: ModeratorMessage[];
  negative: ModeratorMessage[];
};

type ModeratorSentimentCardProps = {
  data: ModeratorEntry[];
};

export function ModeratorSentimentCard({
  data,
}: ModeratorSentimentCardProps) {
  const [selected, setSelected] = React.useState(
    data[0]?.username ?? ""
  );
  const entry = data.find((item) => item.username === selected);

  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Moderator Sentiment Highlights</CardTitle>
        <CardDescription>
          Select a moderator to review their top 5 positive and negative chats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Select
          value={selected}
          onValueChange={(value) => setSelected(value ?? "")}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Pick a moderator" />
          </SelectTrigger>
          <SelectContent>
            {data.map((item) => (
              <SelectItem key={item.username} value={item.username}>
                @{item.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {entry ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Top Positive</p>
              </div>
              <div className="space-y-2">
                {entry.positive.map((item, index) => (
                  <div
                    key={`${entry.username}-pos-${index}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-black/5 bg-white px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Score {item.score.toFixed(3)}
                      </p>
                      <p className="text-sm">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Top Negative</p>
              </div>
              <div className="space-y-2">
                {entry.negative.map((item, index) => (
                  <div
                    key={`${entry.username}-neg-${index}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-black/5 bg-white px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Score {item.score.toFixed(3)}
                      </p>
                      <p className="text-sm">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No moderator data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
