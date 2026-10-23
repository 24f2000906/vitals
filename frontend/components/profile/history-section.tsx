"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dateSpan, KIND_LABEL, statusLabel } from "@/lib/profile";
import type { HistoryEntry, HistoryKind } from "@/lib/types";

const KINDS: HistoryKind[] = ["condition", "treatment", "allergy"];

function Row({ entry, onRemove }: { entry: HistoryEntry; onRemove: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const tone = entry.status === "resolved" ? "ok" : entry.kind === "treatment" ? "neutral" : "warn";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="glass flex items-start gap-3 rounded-2xl p-4"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium wrap-anywhere">{entry.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{dateSpan(entry) || "No dates recorded"}</p>
        {entry.notes && <p className="mt-2 text-sm text-muted-foreground wrap-anywhere">{entry.notes}</p>}
      </div>
      <Badge tone={tone}>{statusLabel(entry.kind, entry.status)}</Badge>
      {confirming ? (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onRemove();
              } catch {
                setBusy(false);
                setConfirming(false);
              }
            }}
          >
            Remove
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Keep
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Remove ${entry.title}`}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </motion.li>
  );
}

export function HistorySection({
  entries,
  loading,
  error,
  onAdd,
  onRemove,
}: {
  entries: HistoryEntry[];
  loading: boolean;
  error: string;
  onAdd: (kind: HistoryKind) => void;
  onRemove: (id: number) => Promise<void>;
}) {
  return (
    <section aria-labelledby="history-title" className="space-y-6">
      <div>
        <h2 id="history-title" className="font-display text-2xl font-semibold tracking-tight">
          Medical history
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Past and ongoing conditions, treatments and allergies. These go into the PDF.</p>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {KINDS.map((kind) => {
        const items = entries.filter((e) => e.kind === kind);
        return (
          <div key={kind} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {KIND_LABEL[kind].plural} <span className="text-muted-foreground">({items.length})</span>
              </h3>
              <Button size="sm" variant="outline" onClick={() => onAdd(kind)}>
                <Plus /> Add {KIND_LABEL[kind].singular}
              </Button>
            </div>
            {loading ? (
              <div className="h-16 animate-pulse rounded-2xl bg-muted/70" />
            ) : items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">None recorded.</p>
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((e) => (
                    <Row key={e.id} entry={e} onRemove={() => onRemove(e.id)} />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}