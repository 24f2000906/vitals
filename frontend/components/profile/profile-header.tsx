"use client";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProfileData } from "@/lib/profile";
import { initials } from "@/lib/utils";

export function ProfileHeader({
  profile,
  summary,
  onDownload,
  downloading,
  error,
}: {
  profile: ProfileData;
  summary: string;
  onDownload: () => void;
  downloading: boolean;
  error?: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="glass flex flex-col gap-6 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8"
    >
      <div className="grid size-20 shrink-0 place-items-center rounded-full bg-primary font-display text-3xl font-bold text-primary-foreground">
        {initials(profile.name)}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-bold tracking-tight wrap-anywhere sm:text-4xl">{profile.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="neutral">{profile.relationship}</Badge>
          {profile.age && <Badge tone="neutral">{profile.age}</Badge>}
          {profile.gender && <Badge tone="neutral">{profile.gender}</Badge>}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{summary}</p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Button size="lg" onClick={onDownload} loading={downloading}>
          <Download /> Download PDF
        </Button>
        <p className="text-xs text-muted-foreground">One A4 page, ready to hand to a doctor</p>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </motion.header>
  );
}