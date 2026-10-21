"use client";
import { Check, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { passwordChecks } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Too short", color: "var(--danger)" },
  { label: "Weak", color: "var(--danger)" },
  { label: "Fair", color: "var(--warn)" },
  { label: "Good", color: "var(--ok)" },
  { label: "Strong", color: "var(--ok)" },
];

export function PasswordStrength({ value }: { value: string }) {
  const checks = passwordChecks(value);
  const score = value ? Object.values(checks).filter(Boolean).length : 0;
  const level = LEVELS[score];
  const rules: [keyof typeof checks, string][] = [
    ["length", "8+ characters"],
    ["upper", "Uppercase letter"],
    ["number", "Number"],
    ["symbol", "Symbol"],
  ];
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{ width: score >= i ? "100%" : "0%", backgroundColor: level.color }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
              />
            </div>
          ))}
        </div>
        <span className="w-16 text-right text-xs font-medium" style={{ color: value ? level.color : undefined }}>
          {value ? level.label : ""}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {rules.map(([key, label]) => (
          <li key={key} className={cn("flex items-center gap-1.5", checks[key] && "text-foreground")}>
            {checks[key] ? <Check className="size-3.5 text-ok" /> : <Circle className="size-3" />}
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
