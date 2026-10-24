import { buildMetrics, PARAM_META, sortByDate, type Level } from "./metrics";
import { formatDate, parseISO } from "./utils";
import type { FamilyMember, Flag, HistoryEntry, HistoryKind, HistoryStatus, ParamKey, User, VaultDocument } from "./types";

export interface ProfileData {
  name: string;
  isSelf: boolean;
  relationship: string;
  age: string | null;
  dob: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  shareCode: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ageLabel(dob?: string | null): string | null {
  const p = parseISO(dob);
  if (!p) return null;
  const now = new Date();
  let months = (now.getFullYear() - p.y) * 12 + (now.getMonth() - p.m);
  if (now.getDate() < p.d) months -= 1;
  if (months < 0) return null;
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
  return `${Math.floor(months / 12)} years`;
}

export function buildProfile(user: User | null, members: FamilyMember[], memberId: number | null): ProfileData | null {
  if (memberId === null) {
    if (!user) return null;
    return {
      name: user.full_name ?? "Unnamed",
      isSelf: true,
      relationship: "Account holder",
      age: ageLabel(user.date_of_birth),
      dob: user.date_of_birth,
      gender: user.gender ? cap(user.gender) : null,
      email: user.email,
      phone: user.phone ? `${user.phone_country_code ?? ""} ${user.phone}`.trim() : null,
      shareCode: user.share_code ?? "",
    };
  }
  const m = members.find((x) => x.id === memberId);
  if (!m) return null;
  return {
    name: m.name,
    isSelf: false,
    relationship: cap(m.relationship),
    age: ageLabel(m.date_of_birth),
    dob: m.date_of_birth,
    gender: cap(m.gender),
    email: m.email,
    phone: m.phone ? `${m.phone_country_code ?? ""} ${m.phone}`.trim() : null,
    shareCode: m.share_code ?? "",
  };
}

export const KIND_LABEL: Record<HistoryKind, { singular: string; plural: string }> = {
  condition: { singular: "condition", plural: "Conditions and diseases" },
  treatment: { singular: "treatment", plural: "Treatments and medication" },
  allergy: { singular: "allergy", plural: "Allergies" },
};

export function statusLabel(kind: HistoryKind, status: HistoryStatus) {
  if (status === "active") return kind === "allergy" ? "Active" : "Ongoing";
  return kind === "treatment" ? "Completed" : "Resolved";
}

export function dateSpan(e: HistoryEntry) {
  if (e.start_date && e.end_date) return `${formatDate(e.start_date)} to ${formatDate(e.end_date)}`;
  if (e.start_date) return `Since ${formatDate(e.start_date)}`;
  if (e.end_date) return `Until ${formatDate(e.end_date)}`;
  return "";
}

/** Active first, then most recent start date. */
export function sortHistory(a: HistoryEntry, b: HistoryEntry) {
  if (a.status !== b.status) return a.status === "active" ? -1 : 1;
  return (b.start_date ?? "").localeCompare(a.start_date ?? "") || b.id - a.id;
}

export function summarySentence(h: HistoryEntry[]) {
  const n = (k: HistoryKind) => h.filter((e) => e.kind === k).length;
  const ongoing = h.filter((e) => e.kind === "condition" && e.status === "active").length;
  if (!h.length) return "No conditions, treatments or allergies recorded yet.";
  const part = (count: number, one: string, many: string) => (count ? `${count} ${count === 1 ? one : many}` : null);
  const parts = [part(n("condition"), "condition", "conditions"), part(n("treatment"), "treatment", "treatments"), part(n("allergy"), "allergy", "allergies")].filter(Boolean);
  return `${parts.join(", ")} recorded${ongoing ? `, ${ongoing} ongoing` : ""}.`;
}

export interface Reading {
  label: string;
  value: string;
  level: Level;
}

export function latestReadings(docs: VaultDocument[]): Reading[] {
  return buildMetrics(docs).flatMap((m) =>
    m.latest === null || m.level === null
      ? []
      : [{ label: m.label, value: `${m.latest}${m.secondary !== null ? `/${m.secondary}` : ""} ${m.unit}`, level: m.level }],
  );
}

export interface Finding {
  label: string;
  message: string;
  level: "high" | "caution";
}

/** Latest flag per parameter across all reports. */
export function latestFindings(docs: VaultDocument[]): Finding[] {
  const map = new Map<ParamKey, Flag>();
  for (const d of sortByDate(docs)) {
    for (const k of Object.keys(d.extracted.values) as ParamKey[]) map.delete(k);
    for (const f of d.extracted.flags) map.set(f.parameter, f);
  }
  return [...map.values()].map((f) => ({ label: PARAM_META[f.parameter].label, message: f.message, level: f.level }));
}