import { Card } from "@/components/ui/card"

export default function LiveChatPage() {
  const channel = "supertf"
  const src = `https://www.twitch.tv/embed/${channel}/chat?parent=localhost&darkpopout`

  return (
    <div className="max-w-7xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Live Chat</h1>

      <Card className="overflow-hidden rounded-2xl">
        <iframe
          src={src}
          className="h-[600 px] w-full"
          frameBorder="0"
        />
      </Card>
    </div>
  )
}





