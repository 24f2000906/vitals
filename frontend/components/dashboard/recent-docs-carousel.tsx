"use client";
import { motion } from "framer-motion";
import { FileImage, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/documents/status-badge";
import type { VaultDocument } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function RecentDocsCarousel({ docs, onOpen }: { docs: VaultDocument[]; onOpen: (d: VaultDocument) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const [limit, setLimit] = useState(0);

  useEffect(() => {
    const measure = () => setLimit(Math.max(0, (track.current?.scrollWidth ?? 0) - (wrap.current?.clientWidth ?? 0)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [docs.length]);

  return (
    <div ref={wrap} className="-mx-1 overflow-hidden px-1 py-1">
      <motion.div
        ref={track}
        drag="x"
        dragConstraints={{ left: -limit, right: 0 }}
        dragElastic={0.12}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={() => setTimeout(() => (dragged.current = false), 0)}
        className="flex w-max cursor-grab gap-4 active:cursor-grabbing"
      >
        {docs.map((d) => {
          const Icon = d.content_type === "application/pdf" ? FileText : FileImage;
          return (
            <button
              key={d.id}
              type="button"
              draggable={false}
              onClick={() => !dragged.current && onOpen(d)}
              className="glass flex w-64 shrink-0 select-none flex-col gap-4 rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-muted text-primary">
                  <Icon className="size-5" />
                </span>
                <StatusBadge status={d.status} />
              </div>
              <div>
                <p className="truncate text-sm font-medium">{d.filename}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(d.extracted.report_date ?? d.created_at)}</p>
              </div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
