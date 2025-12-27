import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type RangeKey = "last_stream" | "past_week" | "past_month"

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground pt-0 text-sm">
        {subtitle}
      </CardContent>
    </Card>
  )
}

function rangeLabel(range: RangeKey) {
  switch (range) {
    case "last_stream":
      return "Last stream"
    case "past_week":
      return "Past week"
    case "past_month":
      return "Past month"
  }
}

export default function DashboardHome() {
  // Later: persist this in query params or localStorage if you want.
  const [range, setRange] = React.useState<RangeKey>("last_stream")

  const hasData = true // wire to backend later

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header + filter */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Basic metrics for {rangeLabel(range).toLowerCase()}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-muted/40 flex rounded-xl border p-1">
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={range === "last_stream"}
              onClick={() => setRange("last_stream")}
              className={[
                "px-3",
                "text-muted-foreground hover:text-foreground",
                "aria-pressed:bg-primary aria-pressed:text-primary-foreground",
                "aria-pressed:hover:bg-primary/90",
              ].join(" ")}
            >
              Last stream
            </Button>

            <Button
              size="sm"
              variant="ghost"
              aria-pressed={range === "past_week"}
              onClick={() => setRange("past_week")}
              className={[
                "px-3",
                "text-muted-foreground hover:text-foreground",
                "aria-pressed:bg-primary aria-pressed:text-primary-foreground",
                "aria-pressed:hover:bg-primary/90",
              ].join(" ")}
            >
              Past week
            </Button>

            <Button
              size="sm"
              variant="ghost"
              aria-pressed={range === "past_month"}
              onClick={() => setRange("past_month")}
              className={[
                "px-3",
                "text-muted-foreground hover:text-foreground",
                "aria-pressed:bg-primary aria-pressed:text-primary-foreground",
                "aria-pressed:hover:bg-primary/90",
              ].join(" ")}
            >
              Past month
            </Button>
          </div>
        </div>
      </div>

      {/* Core metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unique chatters"
          value={hasData ? "3" : "—"}
          subtitle={
            hasData
              ? `Total within ${rangeLabel(range).toLowerCase()}.`
              : "No data yet."
          }
        />
        <StatCard
          title="Chat messages"
          value={hasData ? "48.2k" : "—"}
          subtitle={hasData ? "Total messages captured." : "No data yet."}
        />
        <StatCard
          title="Avg sentiment"
          value={hasData ? "+0.12" : "—"}
          subtitle={
            hasData ? "Range: -1 (negative) to +1 (positive)." : "No data yet."
          }
        />
        <StatCard
          title="Engagement spikes"
          value={hasData ? "11" : "—"}
          subtitle={
            hasData
              ? "Moments of unusually high chat velocity."
              : "No data yet."
          }
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Avg chat rate"
          value={hasData ? "18.4 / min" : "—"}
          subtitle={hasData ? "Messages per minute." : "No data yet."}
        />
        <StatCard
          title="Topic volatility"
          value={hasData ? "1.4×" : "—"}
          subtitle={hasData ? "How frequently topics shift." : "No data yet."}
        />
        <StatCard
          title="Notable moments"
          value={hasData ? "5" : "—"}
          subtitle={
            hasData ? "Candidate clip-worthy segments." : "No data yet."
          }
        />
      </div>
    </div>
  )
}
