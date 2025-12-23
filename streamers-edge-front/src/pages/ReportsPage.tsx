import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ReportsPage() {
  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generated summaries and downloadable reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No reports generated</CardTitle>
          <CardDescription>
            Reports will be created automatically after stream analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          This section will contain PDFs, summaries, and shareable insights for
          each stream.
        </CardContent>
      </Card>
    </div>
  )
}
