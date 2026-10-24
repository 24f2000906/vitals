"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useWorkspace } from "@/components/app/workspace";
import { AddHistoryDialog } from "@/components/profile/add-history-dialog";
import { AiSummary } from "@/components/profile/ai-summary";
import { EditableDetailsGrid } from "@/components/profile/editable-details-grid";
import { HistorySection } from "@/components/profile/history-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileQrCode } from "@/components/profile/profile-qr";
import { ReportsSummary } from "@/components/profile/reports-summary";
import { useHistory } from "@/components/profile/use-history";
import { downloadProfilePdf } from "@/lib/profile-pdf";
import { buildProfile, latestFindings, latestReadings, summarySentence } from "@/lib/profile";
import type { HistoryKind } from "@/lib/types";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { members, visibleDocuments, activeMemberId, loading } = useWorkspace();
  const history = useHistory(activeMemberId);
  const [dialog, setDialog] = useState<{ open: boolean; kind: HistoryKind }>({ open: false, kind: "condition" });
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [aiSummaryText, setAiSummaryText] = useState<string>("");
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [phoneOverride, setPhoneOverride] = useState<string | null>(null);

  const profile = useMemo(() => {
    const base = buildProfile(user, members, activeMemberId);
    if (!base) return null;
    return {
      ...base,
      name: nameOverride ?? base.name,
      phone: phoneOverride !== null ? phoneOverride : base.phone,
    };
  }, [user, members, activeMemberId, nameOverride, phoneOverride]);

  const readings = useMemo(() => latestReadings(visibleDocuments), [visibleDocuments]);
  const findings = useMemo(() => latestFindings(visibleDocuments), [visibleDocuments]);

  if (loading || !profile) {
    return <div className="h-48 animate-pulse rounded-3xl bg-muted/70" role="status" aria-label="Loading profile" />;
  }

  async function download() {
    if (!profile) return;
    setPdfError("");
    setDownloading(true);
    try {
      await downloadProfilePdf({
        profile,
        history: history.entries,
        readings,
        findings,
        documentCount: visibleDocuments.length,
        aiSummary: aiSummaryText || undefined,
      });
    } catch {
      setPdfError("The PDF couldn't be created. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-12">
      <ProfileHeader profile={profile} summary={summarySentence(history.entries)} onDownload={download} downloading={downloading} error={pdfError} />
      <EditableDetailsGrid
        profile={profile}
        documentCount={visibleDocuments.length}
        onProfileUpdated={(updates) => {
          if (updates.full_name) setNameOverride(updates.full_name);
          if (updates.phone !== undefined) setPhoneOverride(updates.phone ?? null);
          void refreshUser();
        }}
      />
      <AiSummary memberId={activeMemberId} onSummaryLoaded={setAiSummaryText} />
      <ProfileQrCode shareCode={profile.shareCode} name={profile.name} />
      <ReportsSummary readings={readings} findings={findings} />
      <HistorySection
        entries={history.entries}
        loading={history.loading}
        error={history.error}
        onAdd={(kind) => setDialog({ open: true, kind })}
        onRemove={history.remove}
      />
      <AddHistoryDialog open={dialog.open} kind={dialog.kind} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} onSave={history.add} />
    </div>
  );
}
