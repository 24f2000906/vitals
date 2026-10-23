import { AlertTriangle, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LEVEL_LABEL, LEVEL_TONE, PARAM_META } from "@/lib/metrics";
import type { ReportPanel } from "@/lib/report";
import { formatDate } from "@/lib/utils";

export function TimelinePanelView({ panel }: { panel: ReportPanel }) {
  return (
    <article className="glass w-full max-w-2xl rounded-3xl p-7 shadow-lg shadow-black/5 sm:p-10">
      {panel.subtitle && <p className="text-sm text-muted-foreground">{formatDate(panel.subtitle)}</p>}
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl [overflow-wrap:anywhere]">{panel.title}</h2>
      {panel.body && <p className="mt-3 leading-relaxed text-muted-foreground">{panel.body}</p>}

      {panel.stats && (
        <dl className="mt-8 grid grid-cols-3 gap-4">
          {panel.stats.map((s) => (
            <div key={s.label}>
              <dd className="font-display text-2xl font-bold">{s.value}</dd>
              <dt className="mt-1 text-xs text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}

      {panel.rows && panel.rows.length > 0 && (
        <ul className="mt-7 divide-y divide-border rounded-2xl border border-border">
          {panel.rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>{r.label}</span>
              <span className="flex items-center gap-3">
                <span className="font-medium tabular-nums">{r.value}</span>
                <Badge tone={LEVEL_TONE[r.level]}>{LEVEL_LABEL[r.level]}</Badge>
              </span>
            </li>
          ))}
        </ul>
      )}

      {panel.flags && panel.flags.length > 0 && (
        <ul className="mt-6 space-y-2">
          {panel.flags.map((f) => (
            <li key={f.parameter} className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${f.level === "high" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn"}`}>
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong>{PARAM_META[f.parameter].label}.</strong> {f.message}
              </span>
            </li>
          ))}
        </ul>
      )}
      {panel.kind === "summary" && panel.flags?.length === 0 && (
        <p className="mt-6 flex items-center gap-2 text-sm text-ok">
          <CircleCheck className="size-4" /> All recent values are in range.
        </p>
      )}
    </article>
  );
}
