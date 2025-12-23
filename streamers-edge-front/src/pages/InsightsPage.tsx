import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function InsightsPage() {
  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Deep analysis of chat behavior and stream content.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insights not available</CardTitle>
          <CardDescription>
            Insights are generated after streams are processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          You’ll see engagement metrics, topic shifts, sentiment trends, and
          notable moments here.
        </CardContent>
      </Card>
    </div>
  )
}
