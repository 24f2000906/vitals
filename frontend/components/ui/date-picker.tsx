"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn, formatDate, parseISO, toISODate } from "@/lib/utils";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onChange,
  id,
  invalid,
  placeholder = "Select date",
}: {
  value?: string;
  onChange: (iso: string) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [today, setToday] = useState<Date | null>(null);
  const selected = useMemo(() => parseISO(value), [value]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({
    y: selected?.y ?? 1995,
    m: selected?.m ?? 0,
  });
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    if (!value) {
      setView((prev) => (prev.y === 1995 && prev.m === 0 ? { y: now.getFullYear() - 30, m: now.getMonth() } : prev));
    }
  }, []);

  useEffect(() => {
    if (value) {
      const p = parseISO(value);
      if (p) setView({ y: p.y, m: p.m });
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && (e.stopPropagation(), setOpen(false));
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc, true);
    };
  }, [open]);

  const shift = (delta: number) =>
    setView(({ y, m }) => {
      const t = new Date(y, m + delta, 1);
      return { y: t.getFullYear(), m: t.getMonth() };
    });

  const lead = new Date(view.y, view.m, 1).getDay();
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const currentYear = today ? today.getFullYear() : 2026;
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);
  const nav = "grid size-8 place-items-center rounded-lg text-foreground transition-colors hover:bg-muted";
  const pick = "h-8 rounded-lg border border-input bg-card px-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const handleToggle = () => {
    if (!open && !today) {
      const now = new Date();
      setToday(now);
      if (!selected) {
        setView({ y: now.getFullYear() - 30, m: now.getMonth() });
      }
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={root} className={cn("relative", open && "z-50")}>
      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid}
        onClick={handleToggle}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-card/70 px-3.5 text-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          invalid && "border-danger",
          !value && "text-muted-foreground/70",
        )}
      >
        <span>{value ? formatDate(value) : placeholder}</span>
        <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Choose date"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center gap-1.5">
              <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className={nav}>
                <ChevronLeft className="size-4" />
              </button>
              <select aria-label="Month" value={view.m} onChange={(e) => setView((v) => ({ ...v, m: +e.target.value }))} className={cn(pick, "flex-1")}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
              <select aria-label="Year" value={view.y} onChange={(e) => setView((v) => ({ ...v, y: +e.target.value }))} className={pick}>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
              <button type="button" aria-label="Next month" onClick={() => shift(1)} className={nav}>
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-1.5">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: lead }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: count }, (_, i) => {
                const d = i + 1;
                const future = today ? new Date(view.y, view.m, d) > today : false;
                const isSel = selected?.y === view.y && selected.m === view.m && selected.d === d;
                const isToday = today ? today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d : false;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={future}
                    aria-pressed={isSel}
                    onClick={() => {
                      onChange(toISODate(view.y, view.m, d));
                      setOpen(false);
                    }}
                    className={cn(
                      "grid h-9 place-items-center rounded-lg text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
                      isToday && "ring-1 ring-accent font-semibold",
                      isSel && "bg-primary text-primary-foreground font-semibold hover:bg-primary",
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
