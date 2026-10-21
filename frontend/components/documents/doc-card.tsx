"use client";
import { motion } from "framer-motion";
import { FileImage, FileText } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import type { VaultDocument } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export function DocCard({ doc, onOpen }: { doc: VaultDocument; onOpen: () => void }) {
  const { memberName } = useWorkspace();
  const Icon = doc.content_type === "application/pdf" ? FileText : FileImage;
  return (
    <motion.button
      layout
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="glass flex flex-col gap-4 rounded-2xl p-5 text-left shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-muted text-primary">
          <Icon className="size-5" />
        </span>
        <StatusBadge status={doc.status} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{doc.filename}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {memberName(doc.member_id)} · {formatBytes(doc.size_bytes)} · {formatDate(doc.extracted.report_date ?? doc.created_at)}
        </p>
      </div>
    </motion.button>
  );
}
