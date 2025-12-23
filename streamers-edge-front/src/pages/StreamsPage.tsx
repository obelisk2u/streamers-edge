import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function TwitchVodEmbed({ vodId }: { vodId: string }) {
  return (
    <div className="border-border aspect-video w-full overflow-hidden rounded-xl border">
      <iframe
        src={`https://player.twitch.tv/?video=${vodId}&parent=localhost&autoplay=false`}
        className="h-full w-full"
        allowFullScreen
      />
    </div>
  )
}

export default function StreamsPage() {
  const vodId = "2634822107"

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Streams</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage and review your past and upcoming streams.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest VOD</CardTitle>
          <CardDescription>
            Embedded Twitch VOD for stream review (placeholder).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TwitchVodEmbed vodId={vodId} />
          <div className="text-muted-foreground text-sm">VOD ID: {vodId}</div>
        </CardContent>
      </Card>
    </div>
  )
}
