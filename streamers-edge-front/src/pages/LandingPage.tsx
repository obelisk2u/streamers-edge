import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-background absolute inset-0" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[880px] -translate-x-1/2 rounded-[56px] bg-gradient-to-br from-indigo-500/14 via-violet-500/10 to-zinc-500/8 blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background))_100%)]" />
      <div className="[background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')] absolute inset-0 opacity-[0.06] mix-blend-overlay" />
    </div>
  )
}
function Stat({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/55 px-5 py-4 backdrop-blur-sm">
      <div className="pointer-events-none absolute -top-10 right-[-60px] h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl" />
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-muted-foreground mt-1 text-xs leading-relaxed">
        {label}
      </div>
    </div>
  )
}

function StatsStrip() {
  return (
    <div className="mx-auto mt-10 w-full max-w-3xl">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat value="20+" label="creators worked with" />
        <Stat value="12M" label="chat messages processed" />
        <Stat value="2,000+" label="hours of stream audio analyzed" />
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <Background />

      {/* Top nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold tracking-tight">Streamers Edge</div>
          <Badge variant="secondary" className="text-[11px]">
            Beta
          </Badge>
        </div>

        <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
          Portal
        </Button>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-16">
        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-16 text-center">
          <div className="flex justify-center">
            <Badge variant="secondary" className="w-fit">
              Data-driven growth for Twitch
            </Badge>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Modernize your growth strategy
          </h1>

          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed">
            Turns your stream data into personalized insights on what drives engagement, improves audience retention, and helps you grow your stream.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/login")}>
              Go to portal
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById("details")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }}
            >
              How it works
            </Button>
          </div>

          <div className="text-muted-foreground mt-4 text-xs">
            Secure sign-in via Twitch. No passwords stored.
          </div>
        </section>
        <StatsStrip />

        <footer className="mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} Streamers Edge. All rights reserved.
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Portal
            </Button>
          </footer>
      </main>
    </div>
  )
}