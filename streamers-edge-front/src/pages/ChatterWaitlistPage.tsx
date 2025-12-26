import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-background absolute inset-0" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[880px] -translate-x-1/2 rounded-[56px] bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-zinc-500/10 blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background))_100%)]" />
    </div>
  )
}

export default function ChatterWaitlistPage() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState("")
  const [twitch, setTwitch] = React.useState("")

  function onSubmit() {
    const e = email.trim()
    const t = twitch.trim()
    if (!e) return
    // TODO: POST to backend later
    console.log("Chatter waitlist:", { email: e, twitch: t || null })
    setEmail("")
    setTwitch("")
  }

  return (
    <div className="min-h-screen">
      <Background />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-sm font-semibold tracking-tight">Streamers Edge</div>
        <div className="text-muted-foreground text-sm">Chatter waitlist</div>
      </header>

      <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join the chatter waitlist</CardTitle>
            <CardDescription>
              We’ll invite chatters when our public statistics are released
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twitch">Twitch username (optional)</Label>
              <Input
                id="twitch"
                placeholder="yourname"
                value={twitch}
                onChange={(e) => setTwitch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmit()
                }}
              />
            </div>

            <Button className="w-full" onClick={onSubmit}>
              Join waitlist
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Back
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}