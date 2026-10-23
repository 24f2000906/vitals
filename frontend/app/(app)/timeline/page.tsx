"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useWorkspace } from "@/components/app/workspace";
import { HorizontalTimeline } from "@/components/timeline/horizontal-timeline";
import { TimelinePanelView } from "@/components/timeline/timeline-panel";
import { buildReport } from "@/lib/report";

export default function ReportPage() {
  const { visibleDocuments, activeName, loading } = useWorkspace();
  const panels = useMemo(() => buildReport(activeName, visibleDocuments), [activeName, visibleDocuments]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight">Health Timeline</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          A timeline of {activeName}&apos;s reports with generated summaries of what changed. Summaries aren&apos;t a diagnosis; bring anything flagged to your doctor.
        </p>
      </header>
      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-muted/70" />
      ) : visibleDocuments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No reports for {activeName} yet.{" "}
          <Link href="/documents" className="font-medium text-primary underline-offset-4 hover:underline">
            Upload one
          </Link>{" "}
          to build the timeline.
        </p>
      ) : (
        <HorizontalTimeline panels={panels.map((p) => <TimelinePanelView key={p.id} panel={p} />)} />
      )}
    </div>
  );
}
