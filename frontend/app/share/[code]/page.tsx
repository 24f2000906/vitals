"use client";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bot,
  Cake,
  CalendarDays,
  Download,
  FileText,
  HeartHandshake,
  Pill,
  ShieldCheck,
  Sparkles,
  UserRound,
  VenusAndMars,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState, use } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { downloadProfilePdf } from "@/lib/profile-pdf";
import type { PublicProfile } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

function Skeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-20" role="status" aria-label="Loading profile">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-danger">
        <AlertTriangle className="size-10" />
      </div>
      <h1 className="font-display text-2xl font-bold">Profile Not Found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This QR code may be invalid or the profile has been removed. Ask the account holder for a new code.
      </p>
      <Link href="/" className="mt-2 text-sm font-medium text-primary hover:underline">
        Go to VITALS home
      </Link>
    </div>
  );
}

function DetailCell({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="glass flex items-start gap-3 rounded-2xl p-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ProfileView({ profile: p }: { profile: PublicProfile }) {
  const [downloading, setDownloading] = useState(false);
  const KindIcon: Record<string, React.ElementType> = { condition: Activity, treatment: Pill, allergy: AlertTriangle };
  const KindLabel: Record<string, string> = { condition: "Condition", treatment: "Treatment", allergy: "Allergy" };

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadProfilePdf({
        profile: {
          name: p.name,
          isSelf: p.relationship === "Self",
          relationship: p.relationship ?? "Self",
          age: p.age,
          dob: p.date_of_birth,
          gender: p.gender,
          email: null,
          phone: null,
          shareCode: p.share_code,
        },
        history: p.history,
        readings: (p.readings || []).map((r) => ({
          label: r.name || "Reading",
          value: `${r.value}${r.unit ? ` ${r.unit}` : ""}`,
          level: (r.status as "ok" | "caution" | "high") ?? "ok",
        })),
        findings: (p.findings || []).map((f) => ({
          label: f.category || "Finding",
          message: f.text || "",
          level: (f.level === "ok" ? "caution" : f.level) as "high" | "caution",
        })),
        documentCount: p.document_count,
        aiSummary: p.ai_summary ?? undefined,
      });
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.05 }}
      className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-8 sm:py-14"
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">VITALS Health Pass</p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{p.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[p.relationship, p.age, p.gender].filter(Boolean).join("  ·  ")}
          </p>
        </div>
        <Button onClick={handleDownload} loading={downloading} className="gap-2">
          <Download className="size-4" /> Download PDF
        </Button>
      </header>

      {/* Details Grid */}
      <section className="grid gap-3 sm:grid-cols-2">
        <DetailCell icon={UserRound} label="Full Name" value={p.name} />
        <DetailCell icon={Cake} label="Date of Birth" value={p.date_of_birth ? formatDate(p.date_of_birth) : null} />
        <DetailCell icon={CalendarDays} label="Age" value={p.age} />
        <DetailCell icon={VenusAndMars} label="Gender" value={p.gender} />
        <DetailCell icon={HeartHandshake} label="Relationship" value={p.relationship} />
        <DetailCell icon={FileText} label="Documents on File" value={`${p.document_count} document${p.document_count !== 1 ? "s" : ""}`} />
      </section>

      {/* AI Medical Summary */}
      {p.ai_summary && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Sparkles className="size-4 text-primary" /> AI Medical Summary
          </h2>
          <div className="glass rounded-2xl p-5">
            <p className="text-sm leading-relaxed text-foreground">{p.ai_summary}</p>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <Bot className="size-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {p.summary_source === "nvidia"
                  ? "Generated by NVIDIA AI from uploaded medical documents."
                  : "Summary based on uploaded profile data."}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Vital Readings */}
      {p.readings && p.readings.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Latest Vital Readings</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {p.readings.map((r, i) => (
              <div key={i} className="glass rounded-xl p-3.5">
                <p className="text-xs text-muted-foreground">{r.name}</p>
                <p className="mt-1 font-display text-lg font-bold">
                  {r.value} <span className="text-xs font-normal text-muted-foreground">{r.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Medical History */}
      {p.history.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Medical History</h2>
          <div className="space-y-2">
            {p.history.map((h) => {
              const Icon = KindIcon[h.kind] ?? Activity;
              return (
                <div key={h.id} className="glass flex items-start gap-3 rounded-xl px-4 py-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{h.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${h.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {h.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {KindLabel[h.kind] ?? h.kind}
                      {h.start_date ? ` · Since ${formatDate(h.start_date)}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            This health profile was shared via VITALS. The data is user-entered and AI-assisted.
            It is not a medical diagnosis. Always consult a licensed healthcare professional for clinical decisions.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ShareContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api
      .publicProfile(code)
      .then(setProfile)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="glass sticky top-0 z-40 border-b border-border/40 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="transition hover:opacity-80" aria-label="VITALS home">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/signin" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {loading ? <Skeleton /> : notFound ? <NotFound /> : profile ? <ProfileView profile={profile} /> : <NotFound />}
    </div>
  );
}

export default function SharePage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <ShareContent params={params} />
    </Suspense>
  );
}
