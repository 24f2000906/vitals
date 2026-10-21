"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

/**
 * Sticky track: vertical scroll drives a horizontal slide through the panels.
 * Reduced-motion users get the panels stacked instead.
 */
export function HorizontalTimeline({ panels }: { panels: ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const n = panels.length;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `${-((n - 1) / n) * 100}%`]);

  if (reduce || n < 2) {
    return <div className="space-y-6">{panels.map((p, i) => <div key={i}>{p}</div>)}</div>;
  }

  return (
    <div ref={ref} style={{ height: `${n * 90}vh` }} className="relative">
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col justify-center overflow-hidden md:top-0 md:h-screen">
        <motion.div style={{ x, width: `${n * 100}%` }} className="flex">
          {panels.map((p, i) => (
            <div key={i} style={{ width: `${100 / n}%` }} className="flex shrink-0 items-center justify-center px-2 sm:px-6">
              {p}
            </div>
          ))}
        </motion.div>
        <div className="mx-auto mt-8 h-1 w-48 overflow-hidden rounded-full bg-muted" aria-hidden>
          <motion.div style={{ scaleX: scrollYProgress }} className="h-full origin-left bg-primary" />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Scroll to move through the timeline</p>
      </div>
    </div>
  );
}
