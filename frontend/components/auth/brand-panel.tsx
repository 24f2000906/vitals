"use client";
import { motion } from "framer-motion";
import { Logo } from "../logo";

export function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border/70 p-12 lg:flex">
      <Logo />
      <div className="max-w-md">
        <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">Your family&apos;s health record, in one place.</h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Keep lab reports and prescriptions together, watch how your numbers change over time, and read plain-language summaries of what each report says.
        </p>
        <svg viewBox="0 0 640 160" className="mt-12 h-36 w-full" aria-hidden>
          <path d="M0 90H640" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 7" />
          <motion.path
            d="M0 90H150L172 90L190 40L214 140L236 22L252 90H330L346 72L362 90H640"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut", times: [0, 0.7, 1] }}
          />
        </svg>
      </div>
      <p className="text-xs text-muted-foreground">Your records stay private to your account and the family members you add.</p>
    </aside>
  );
}
