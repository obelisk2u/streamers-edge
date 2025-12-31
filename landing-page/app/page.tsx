import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardPromptButton } from "@/components/dashboard-prompt-button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xl font-semibold tracking-tight">
              Streamers Edge
            </div>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">Just Chatting</Badge>
            <Badge variant="outline">Pilot</Badge>
            <Badge variant="outline">No Twitch login</Badge>
          </div>

          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            See when chat came alive — and why.
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            Streamers Edge analyzes your last stream and turns it into a simple,
            shareable dashboard showing chat spikes, topic flow, and what to
            repeat next stream.
          </p>

          <div className="flex flex-wrap gap-4">
            <DashboardPromptButton label="See my dashboard" />

            <a
              className={buttonVariants({ size: "lg", variant: "outline" })}
              href="/example"
            >
              See example
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            Want a free pilot? Email{" "}
            <a className="underline underline-offset-4" href="mailto:jordan@streamers-edge.com">
              jordan@streamers-edge.com
            </a>
            .
          </p>
        </div>
      </section>

      <Separator />

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-10 text-2xl font-semibold">
          What the dashboard shows
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title="Conversation timeline"
            description="Chat activity minute-by-minute across your stream."
          />
          <Feature
            title="Hype moments"
            description="The moments when chat engagement peaked."
          />
          <Feature
            title="Topic flow"
            description="What you were talking about when chat reacted."
          />
          <Feature
            title="Audience dynamics"
            description="When new chatters arrived and when energy faded."
          />
          <Feature
            title="Actionable takeaways"
            description="Clear suggestions for what to repeat next stream."
          />
          <Feature
            title="Static report"
            description="No logins, no permissions — just a private link."
          />
        </div>
      </section>

      <Separator />

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-10 text-2xl font-semibold">
          How it works
        </h2>

        <div className="grid gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="Send your Twitch username"
            description="No Twitch login or permissions required."
          />
          <Step
            number="2"
            title="We analyze your last stream"
            description="Chat activity, transcript, and topic shifts."
          />
          <Step
            number="3"
            title="Get a dashboard"
            description="A clean, shareable report with insights."
          />
        </div>
      </section>

      <Separator />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Card>
          <CardHeader>
            <CardTitle>
              Running a small pilot with Just Chatting creators
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              Free, one-off report. Looking for feedback. Email{" "}
              <a className="underline underline-offset-4" href="mailto:jordan@streamers-edge.com">
                jordan@streamers-edge.com
              </a>{" "}
              to request a pilot.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">
        Step {number}
      </div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-muted-foreground">{description}</div>
    </div>
  );
}
