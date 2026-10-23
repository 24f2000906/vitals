import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LEVEL_LABEL, LEVEL_TONE } from "@/lib/metrics";
import type { Finding, Reading } from "@/lib/profile";

export function ReportsSummary({ readings, findings }: { readings: Reading[]; findings: Finding[] }) {
  return (
    <section aria-labelledby="reports-title" className="space-y-4">
      <h2 id="reports-title" className="font-display text-2xl font-semibold tracking-tight">
        From uploaded reports
      </h2>
      {readings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No lab values read yet.{" "}
          <Link href="/documents" className="font-medium text-primary underline-offset-4 hover:underline">
            Upload a report
          </Link>{" "}
          and its latest HbA1c, blood pressure and cholesterol will appear here and in the PDF.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {readings.map((r) => (
            <div key={r.label} className="glass rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">{r.value}</p>
              <Badge tone={LEVEL_TONE[r.level]} className="mt-2">
                {LEVEL_LABEL[r.level]}
              </Badge>
            </div>
          ))}
        </div>
      )}
      {findings.length > 0 && (
        <ul className="space-y-2">
          {findings.map((f) => (
            <li
              key={f.label}
              className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${f.level === "high" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn"}`}
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong>{f.label}.</strong> {f.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}