import { docDate, levelFor, PARAM_META, sortByDate, type Level } from "./metrics";
import type { Flag, ParamKey, VaultDocument } from "./types";

export interface ReportRow {
  label: string;
  value: string;
  level: Level;
}

export interface ReportPanel {
  id: string;
  kind: "overview" | "record" | "summary";
  title: string;
  subtitle?: string;
  body?: string;
  stats?: { label: string; value: string }[];
  rows?: ReportRow[];
  flags?: Flag[];
}

const ORDER: ParamKey[] = ["hba1c", "systolic", "diastolic", "total_cholesterol", "ldl"];

function rowsFor(doc: VaultDocument): ReportRow[] {
  return ORDER.flatMap((k) => {
    const v = doc.extracted.values[k];
    return v === undefined ? [] : [{ label: PARAM_META[k].label, value: `${v} ${PARAM_META[k].unit}`, level: levelFor(k, v) }];
  });
}

export function buildReport(name: string, docs: VaultDocument[]): ReportPanel[] {
  const sorted = sortByDate(docs);
  const flagged = sorted.filter((d) => d.extracted.flags.length > 0).length;

  const panels: ReportPanel[] = [
    {
      id: "overview",
      kind: "overview",
      title: `${name}'s health timeline`,
      body: "Values are pulled from the documents in this vault and set against typical adult reference ranges. Check them against the originals before acting on them.",
      stats: [
        { label: "Documents", value: String(sorted.length) },
        { label: "With flagged values", value: String(flagged) },
        { label: "Span", value: sorted.length > 1 ? `${docDate(sorted[0]).slice(0, 7)} to ${docDate(sorted[sorted.length - 1]).slice(0, 7)}` : sorted.length ? docDate(sorted[0]).slice(0, 7) : "None yet" },
      ],
    },
  ];

  for (const d of sorted) {
    const rows = rowsFor(d);
    panels.push({
      id: `doc-${d.id}`,
      kind: "record",
      title: d.filename,
      subtitle: docDate(d),
      rows,
      flags: d.extracted.flags,
      body: d.extracted.flags.length
        ? `${d.extracted.flags.length} value${d.extracted.flags.length > 1 ? "s" : ""} outside the usual range.`
        : rows.length
          ? "Every value read from this report is within the usual range."
          : "No lab values could be read from this file.",
    });
  }

  // latest flag per parameter across the whole history
  const latest = new Map<string, Flag>();
  for (const d of sorted) {
    for (const k of ORDER) if (d.extracted.values[k] !== undefined) latest.delete(k);
    for (const f of d.extracted.flags) latest.set(f.parameter, f);
  }
  panels.push({
    id: "summary",
    kind: "summary",
    title: "Worth raising at the next appointment",
    body: latest.size
      ? "These came from the most recent report that included each value."
      : "Nothing in the latest values falls outside the usual ranges.",
    flags: [...latest.values()],
  });
  return panels;
}
