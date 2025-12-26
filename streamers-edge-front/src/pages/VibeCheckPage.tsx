import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function MetricCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground pt-0 text-sm">
        {description}
      </CardContent>
    </Card>
  )
}

export default function VibeCheckPage() {
  const hasData = true // flip later

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Vibe Check</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A high-level look at chat mood, energy, and chaos.
        </p>
      </div>

      {/* Overview metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Overall vibe"
          value={hasData ? "Mixed" : "—"}
          description={
            hasData
              ? "Positive and negative segments evenly distributed."
              : "No chat data yet."
          }
        />
        <MetricCard
          label="Saltiest moment"
          value={hasData ? "01:42–01:47" : "—"}
          description={
            hasData ? "Sharp spike in negative sentiment." : "No chat data yet."
          }
        />
        <MetricCard
          label="Most negative chatter"
          value={hasData ? "user123" : "—"}
          description={
            hasData
              ? "Avg sentiment –0.82 across the stream."
              : "No chat data yet."
          }
        />
        <MetricCard
          label="Most positive chatter"
          value={hasData ? "userxyz" : "—"}
          description={
            hasData ? "Consistently positive and engaged." : "No chat data yet."
          }
        />
      </div>

      {/* Standout chatters */}
      <Card>
        <CardHeader>
          <CardTitle>Standout chatters</CardTitle>
          <CardDescription>Who influenced the chat the most.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {hasData ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border-border rounded-lg border p-4">
                <div className="text-xs tracking-wide uppercase">
                  Most negative
                </div>
                <div className="text-foreground mt-1 font-medium">user123</div>
                <div className="mt-1">Avg sentiment –0.82</div>
              </div>
              <div className="border-border rounded-lg border p-4">
                <div className="text-xs tracking-wide uppercase">
                  Most positive
                </div>
                <div className="text-foreground mt-1 font-medium">userxyz</div>
                <div className="mt-1">Avg sentiment +0.74</div>
              </div>
              <div className="border-border rounded-lg border p-4">
                <div className="text-xs tracking-wide uppercase">
                  Most active
                </div>
                <div className="text-foreground mt-1 font-medium">
                  chatter007
                </div>
                <div className="mt-1">412 messages</div>
              </div>
            </div>
          ) : (
            <div>
              Once chat data is available, we’ll highlight chatters who had an
              outsized impact on the overall vibe.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
