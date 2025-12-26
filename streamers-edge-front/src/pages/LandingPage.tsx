import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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

function Feature({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card className="border bg-card/60 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        <div className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {description}
        </div>
      </CardContent>
    </Card>
  )
}

export default function LandingPage() {
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

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/portal">Login</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <section className="grid gap-10 py-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="space-y-5">
              <Badge variant="secondary" className="w-fit">
                Creator analytics platform
              </Badge>

              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Professional analytics for stream performance.
              </h1>

              <p className="text-muted-foreground max-w-xl text-base leading-relaxed">
                Streamers Edge turns your streams into structured insights: what happened,
                when it mattered, and what to do next. Built for creators who want
                repeatable improvement, not gimmicks.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/login">
                    <Button size="lg">
                    Go to login portal
                    </Button>
                </Link>

                <Button size="lg" variant="outline" asChild={false}>
                    <a href="#product">See what you get</a>
                </Button>
                </div>
              </div>

              <div className="text-muted-foreground text-xs">
                Secure sign-in via Twitch. No passwords stored.
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-sm font-semibold tracking-tight">
                  What this replaces
                </div>
                <div className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Manual VOD scrubbing, guessing why engagement dropped, and relying
                  on memory. You get a clear readout of the stream with metrics and
                  annotated moments.
                </div>

                <Separator className="my-5" />

                <div className="grid gap-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-muted-foreground">Stream summary</div>
                    <div className="font-medium">Auto-generated</div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-muted-foreground">Key moments</div>
                    <div className="font-medium">Detected + timestamped</div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-muted-foreground">Trend tracking</div>
                    <div className="font-medium">Week / month views</div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-muted-foreground">Access</div>
                    <div className="font-medium">Streamer portal</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section id="product" className="py-10">
          <div className="mb-6">
            <div className="text-sm font-semibold tracking-tight">Product</div>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
              A focused set of tools that answer the questions streamers actually have.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              title="Executive summary"
              description="One page you can trust: the stream’s outcomes, notable segments, and the few metrics that explain the story."
            />
            <Feature
              title="Moments that matter"
              description="Automatically identify spikes, dips, and standout segments so you can review fast and clip intelligently."
            />
            <Feature
              title="Trend views"
              description="Compare last stream vs week vs month to see if changes are consistent or just noise."
            />
            <Feature
              title="Reports"
              description="Exportable reports designed for decisions: content planning, pacing, and stream format tuning."
            />
            <Feature
              title="Streamer-first privacy"
              description="Access is scoped to the streamer account. Authentication is handled via Twitch."
            />
            <Feature
              title="Built for iteration"
              description="Clear baselines and deltas so you can test changes and see whether they actually worked."
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} Streamers Edge. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                <a href="/portal">Login</a>
                </Button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}