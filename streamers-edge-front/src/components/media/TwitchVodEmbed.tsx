export function TwitchVodEmbed({ vodId }: { vodId: string }) {
  const parent = window.location.hostname

  return (
    <div className="border-border aspect-video w-full overflow-hidden rounded-xl border">
      <iframe
        src={`https://player.twitch.tv/?video=${vodId}&parent=${parent}&autoplay=false`}
        className="h-full w-full"
        allowFullScreen
      />
    </div>
  )
}
