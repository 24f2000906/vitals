"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useWorkspace } from "@/components/app/workspace";
import { AskAI } from "@/components/dashboard/ask-ai";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentDocsCarousel } from "@/components/dashboard/recent-docs-carousel";
import { DocViewer } from "@/components/documents/doc-viewer";
import { Reveal } from "@/components/reveal";
import { buildMetrics } from "@/lib/metrics";
import type { VaultDocument } from "@/lib/types";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const { visibleDocuments, activeName, activeMemberId, loading } = useWorkspace();
  const [open, setOpen] = useState<VaultDocument | null>(null);
  const [greet, setGreet] = useState("Good day");
  const metrics = buildMetrics(visibleDocuments);
  const first = user?.full_name?.split(" ")[0];

  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {activeMemberId === null ? `${greet}, ${first}` : `${activeName}'s overview`}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {visibleDocuments.length
            ? `Latest readings from ${visibleDocuments.length} document${visibleDocuments.length > 1 ? "s" : ""}.`
            : `Nothing here yet for ${activeName}.`}
        </p>
      </header>

      <section aria-label="Key metrics" className="grid gap-5 md:grid-cols-3">
        {!loading && metrics.map((m, i) => <MetricCard key={`${activeMemberId}-${m.key}`} metric={m} index={i} />)}
      </section>

      <Reveal>
        <section aria-labelledby="recent-title" className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 id="recent-title" className="font-display text-2xl font-semibold tracking-tight">
              Recent uploads
            </h2>
            <Link href="/documents" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Open vault
            </Link>
          </div>
          {visibleDocuments.length ? (
            <RecentDocsCarousel docs={visibleDocuments.slice(0, 12)} onOpen={setOpen} />
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Uploaded reports will line up here. Drag to scroll through them.
            </p>
          )}
        </section>
      </Reveal>

      <Reveal>
        <AskAI />
      </Reveal>
      <DocViewer doc={open} onClose={() => setOpen(null)} />
    </div>
  );
}
