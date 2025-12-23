import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-background absolute inset-0" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[880px] -translate-x-1/2 rounded-[56px] bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-zinc-500/10 blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background))_100%)]" />
    </div>
  )
}

export default function LoginPage() {
  const [waitlistEmail, setWaitlistEmail] = useState("")
  const [waitlistTwitch, setWaitlistTwitch] = useState("")

  const onTwitchLogin = () => {
    // IMPORTANT: full page redirect, not SPA navigation
    window.location.href = `${API_URL}/auth/twitch/start`
  }

  const onWaitlist = () => {
    if (!waitlistEmail || !waitlistTwitch) return
    console.log("Request access:", {
      twitch: waitlistTwitch,
      email: waitlistEmail,
    })
    setWaitlistEmail("")
    setWaitlistTwitch("")
  }

  return (
    <div className="min-h-screen">
      <Background />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-sm font-semibold tracking-tight">
          Streamers Edge
        </div>
        <div className="text-muted-foreground text-sm">Streamer portal</div>
      </header>

      <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              Connect your Twitch account to access your dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Primary login */}
            <Button className="w-full" onClick={onTwitchLogin}>
              Continue with Twitch
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="bg-border h-px flex-1" />
              <div className="text-muted-foreground text-xs">or</div>
              <div className="bg-border h-px flex-1" />
            </div>

            {/* Request access */}
            <div className="flex justify-center">
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="outline" className="px-6">
                      Request access
                    </Button>
                  }
                />

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Request access</AlertDialogTitle>
                    <AlertDialogDescription>
                      We prioritize active Twitch streamers. We’ll reach out if
                      you’re a good fit.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="waitlist-twitch">
                        Twitch username
                      </Label>
                      <Input
                        id="waitlist-twitch"
                        placeholder="yourchannel"
                        value={waitlistTwitch}
                        onChange={(e) => setWaitlistTwitch(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="waitlist-email">Email</Label>
                      <Input
                        id="waitlist-email"
                        placeholder="you@domain.com"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onWaitlist()
                        }}
                      />
                    </div>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onWaitlist}>
                      Submit
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <p className="text-muted-foreground text-center text-xs">
              We use Twitch login to verify account ownership. No passwords.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}