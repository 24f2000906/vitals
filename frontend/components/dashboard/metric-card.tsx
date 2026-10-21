"use client";
import { animate, motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LEVEL_COLOR, LEVEL_LABEL, LEVEL_TONE, type Metric } from "@/lib/metrics";

function CountUp({ value, decimals }: { value: number; decimals: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 1.1, ease: "easeOut", onUpdate: setV });
    return () => c.stop();
  }, [value]);
  return <>{v.toFixed(decimals)}</>;
}

function Sparkline({ series, color }: { series: number[]; color: string }) {
  const w = 160;
  const h = 44;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map((v, i) => [series.length === 1 ? w / 2 : (i / (series.length - 1)) * (w - 8) + 4, h - 6 - ((v - min) / span) * (h - 12)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-full" aria-hidden>
      {pts.length > 1 && <motion.path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeOut" }} />}
      <motion.circle cx={lx} cy={ly} r="4" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, type: "spring" }} />
    </svg>
  );
}

export function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const { label, unit, latest, secondary, previous, level, series, target, decimals } = metric;

  if (latest === null || level === null) {
    return (
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 20, delay: index * 0.08 }} className="flex flex-col justify-between rounded-3xl border border-dashed border-border p-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-6 text-sm text-muted-foreground">
          No readings yet.{" "}
          <Link href="/documents" className="font-medium text-primary underline-offset-4 hover:underline">
            Upload a lab report
          </Link>{" "}
          to see this trend.
        </p>
      </motion.div>
    );
  }

  const delta = previous === null ? null : latest - previous;
  const color = LEVEL_COLOR[level];
  const Trend = delta === null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: index * 0.08 }}
      className="glass rounded-3xl p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        <Badge tone={LEVEL_TONE[level]}>{LEVEL_LABEL[level]}</Badge>
      </div>
      <p className="mt-4 font-display text-5xl font-bold tracking-tight tabular-nums">
        <CountUp value={latest} decimals={decimals} />
        {secondary !== null && <span className="text-3xl text-muted-foreground">/{secondary}</span>}
        <span className="ml-1.5 text-base font-medium text-muted-foreground">{unit}</span>
      </p>
      <div className="mt-4">
        <Sparkline series={series} color={color} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Trend className="size-3.5" />
          {delta === null ? "First reading" : delta === 0 ? "No change" : `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta).toFixed(decimals)} since last report`}
        </span>
        <span>Target: {target}</span>
      </div>
    </motion.article>
  );
}
