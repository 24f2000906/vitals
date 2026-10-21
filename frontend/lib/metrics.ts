import type { ParamKey, VaultDocument } from "./types";

export type Level = "ok" | "caution" | "high";

export const PARAM_META: Record<ParamKey, { label: string; unit: string }> = {
  hba1c: { label: "HbA1c", unit: "%" },
  systolic: { label: "Systolic BP", unit: "mmHg" },
  diastolic: { label: "Diastolic BP", unit: "mmHg" },
  total_cholesterol: { label: "Total cholesterol", unit: "mg/dL" },
  ldl: { label: "LDL cholesterol", unit: "mg/dL" },
};

/** Same thresholds as the backend (typical adult reference ranges; screening hints, not diagnoses). */
export function levelFor(param: ParamKey, v: number): Level {
  const t: Record<ParamKey, [number, number]> = {
    hba1c: [5.7, 6.5],
    systolic: [130, 140],
    diastolic: [80, 90],
    total_cholesterol: [200, 240],
    ldl: [130, 160],
  };
  const [caution, high] = t[param];
  return v >= high ? "high" : v >= caution ? "caution" : "ok";
}

const worst = (a: Level, b: Level): Level => (a === "high" || b === "high" ? "high" : a === "caution" || b === "caution" ? "caution" : "ok");

export function docDate(d: VaultDocument) {
  return d.extracted.report_date ?? d.created_at.slice(0, 10);
}

export function sortByDate(docs: VaultDocument[]) {
  return [...docs].sort((a, b) => docDate(a).localeCompare(docDate(b)) || a.created_at.localeCompare(b.created_at));
}

export interface Metric {
  key: "hba1c" | "bp" | "cholesterol";
  label: string;
  unit: string;
  target: string;
  decimals: number;
  series: number[];
  latest: number | null;
  secondary: number | null; // diastolic for BP
  previous: number | null;
  level: Level | null;
}

export function buildMetrics(docs: VaultDocument[]): Metric[] {
  const sorted = sortByDate(docs);
  const pick = (k: ParamKey) => sorted.flatMap((d) => (d.extracted.values[k] !== undefined ? [d.extracted.values[k] as number] : []));
  const hba1c = pick("hba1c");
  const chol = pick("total_cholesterol");
  const bpDocs = sorted.filter((d) => d.extracted.values.systolic !== undefined && d.extracted.values.diastolic !== undefined);
  const sys = bpDocs.map((d) => d.extracted.values.systolic as number);
  const dia = bpDocs.map((d) => d.extracted.values.diastolic as number);
  const last = <T,>(a: T[]) => (a.length ? a[a.length - 1] : null);
  const prev = <T,>(a: T[]) => (a.length > 1 ? a[a.length - 2] : null);

  return [
    {
      key: "hba1c", label: "HbA1c", unit: "%", target: "Below 5.7%", decimals: 1,
      series: hba1c, latest: last(hba1c), secondary: null, previous: prev(hba1c),
      level: hba1c.length ? levelFor("hba1c", last(hba1c)!) : null,
    },
    {
      key: "bp", label: "Blood pressure", unit: "mmHg", target: "Below 130/80", decimals: 0,
      series: sys, latest: last(sys), secondary: last(dia), previous: prev(sys),
      level: sys.length ? worst(levelFor("systolic", last(sys)!), levelFor("diastolic", last(dia)!)) : null,
    },
    {
      key: "cholesterol", label: "Total cholesterol", unit: "mg/dL", target: "Below 200 mg/dL", decimals: 0,
      series: chol, latest: last(chol), secondary: null, previous: prev(chol),
      level: chol.length ? levelFor("total_cholesterol", last(chol)!) : null,
    },
  ];
}

export const LEVEL_LABEL: Record<Level, string> = { ok: "In range", caution: "Borderline", high: "Above range" };
export const LEVEL_TONE: Record<Level, "ok" | "warn" | "danger"> = { ok: "ok", caution: "warn", high: "danger" };
export const LEVEL_COLOR: Record<Level, string> = { ok: "var(--ok)", caution: "var(--warn)", high: "var(--danger)" };
