import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel
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

export default function StreamerLoginPage() {
  return (
    <div className="min-h-screen">
      <Background />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-sm font-semibold tracking-tight">Streamers Edge</div>
        <div className="text-muted-foreground text-sm">Streamer portal</div>
      </header>

      <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Streamer sign in</CardTitle>
            <CardDescription>Connect your Twitch account to continue.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
                className="w-full"
                onClick={() => {
                window.location.href = `${API_URL}/auth/twitch/start`
                }}
            >
                Continue with Twitch
            </Button>

            <AlertDialog>
                <AlertDialogTrigger
                    render={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                    >
                        Requirements for eligibility
                    </Button>
                    }
                />

                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Streamer requirements</AlertDialogTitle>
                    <AlertDialogDescription>
                        To get value from Streamers Edge, your channel should meet the following:
                    </AlertDialogDescription>
                    </AlertDialogHeader>

                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>VODs must be enabled on your Twitch channel</li>
                    <li>You stream at least 3 times per week</li>
                    </ul>

                    <AlertDialogFooter>
                    <AlertDialogCancel variant="default">Got it</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
      </main>
    </div>
  )
}