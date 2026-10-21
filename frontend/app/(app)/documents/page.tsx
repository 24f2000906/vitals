"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useWorkspace } from "@/components/app/workspace";
import { DocCard } from "@/components/documents/doc-card";
import { DocViewer } from "@/components/documents/doc-viewer";
import { Dropzone } from "@/components/documents/dropzone";
import type { VaultDocument } from "@/lib/types";

export default function DocumentsPage() {
  const { visibleDocuments, activeName, loading } = useWorkspace();
  const [open, setOpen] = useState<VaultDocument | null>(null);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight">Documents vault</h1>
        <p className="mt-2 text-muted-foreground">
          Showing {activeName}&apos;s documents. Switch people from the Family list in the sidebar.
        </p>
      </header>
      <Dropzone />
      <section aria-label="Documents">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/70" />
            ))}
          </div>
        ) : visibleDocuments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No documents for {activeName} yet. Drop a lab report above to start their timeline.
          </p>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {visibleDocuments.map((d) => (
                <DocCard key={d.id} doc={d} onOpen={() => setOpen(d)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
      <DocViewer doc={open} onClose={() => setOpen(null)} />
    </div>
  );
}
