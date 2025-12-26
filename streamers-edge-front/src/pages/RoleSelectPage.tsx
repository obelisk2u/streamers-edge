import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-background absolute inset-0" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[880px] -translate-x-1/2 rounded-[56px] bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-zinc-500/10 blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background))_100%)]" />
    </div>
  )
}

export default function RoleSelectPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <Background />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-sm font-semibold tracking-tight">Streamers Edge</div>
        <div className="text-muted-foreground text-sm">Beta access</div>
      </header>

      <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-6">
        {/* match waitlist page width */}
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">I am a</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => navigate("/login/streamer")}>
              Streamer
            </Button>

            <div className="flex w-full items-center gap-2">
              <div className="bg-border h-px flex-1" />
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                or
              </span>
              <div className="bg-border h-px flex-1" />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login/chatter")}
            >
              Chatter
            </Button>

            <p className="text-muted-foreground text-center text-[11px]">
              Streamers sign in with Twitch. Chatters can join the waitlist.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}