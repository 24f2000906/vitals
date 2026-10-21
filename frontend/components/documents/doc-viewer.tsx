"use client";
import { Check, Copy, Download, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/app/workspace";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { PARAM_META } from "@/lib/metrics";
import type { VaultDocument } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { DocumentViewer } from "./document-viewer";
import { StatusBadge } from "./status-badge";

function Preview({ doc }: { doc: VaultDocument }) {
  // The file lives in private Cloudinary storage; the API fetches it for us behind the user's login.
  // It is shown from a local blob URL because an <iframe>/<img> cannot send an Authorization header.
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setSrc(null);
    setFailed(false);
    api
      .documentBlob(doc.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id]);

  if (failed) return <p className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">The original couldn&apos;t be loaded.</p>;
  if (!src) return <div className="h-full min-h-72 animate-pulse bg-muted" aria-label="Loading preview" />;
  return (
    <DocumentViewer
      viewUrl={src}
      mimeType={doc.content_type}
      title={`Preview of ${doc.filename}`}
      className="h-full min-h-[28rem] rounded-none border-0"
      imageClassName="mx-auto max-h-[32rem] min-h-0 w-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function DocViewer({ doc, onClose }: { doc: VaultDocument | null; onClose: () => void }) {
  const { refreshDocuments } = useWorkspace();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"download" | "delete" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // keep the last document mounted during the close animation
  const [shown, setShown] = useState<VaultDocument | null>(doc);
  useEffect(() => {
    if (doc) setShown(doc);
  }, [doc]);
  const d = doc ?? shown;

  // a different document starts with a clean slate
  useEffect(() => setActionError(null), [doc?.id]);

  async function download(id: string) {
    setBusy("download");
    setActionError(null);
    try {
      const { download_url } = await api.documentDownloadUrl(id);
      // Cloudinary serves this signed link as an attachment, so navigating to it saves the file
      // (window.open after an await gets blocked by popup blockers)
      const a = document.createElement("a");
      a.href = download_url;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Are you sure you want to permanently delete this document? This action cannot be undone.")) return;
    setBusy("delete");
    setActionError(null);
    try {
      await api.deleteDocument(id);
      onClose();
      await refreshDocuments().catch(() => {});
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      {d && (
        <DialogContent title={d.filename} description={`${formatBytes(d.size_bytes)} · uploaded ${formatDate(d.created_at)}`} className="max-w-5xl">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
              <Preview doc={d} />
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={d.status} />
                {d.extracted.flags.map((f) => (
                  <Badge key={f.parameter} tone={f.level === "high" ? "danger" : "warn"}>
                    {PARAM_META[f.parameter].label}: {f.level === "high" ? "above range" : "borderline"}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" loading={busy === "download"} disabled={busy !== null} onClick={() => void download(d.id)}>
                  {busy !== "download" && <Download />} Download
                </Button>
                <Button size="sm" variant="outline" loading={busy === "delete"} disabled={busy !== null} onClick={() => void remove(d.id)} className="text-danger hover:bg-danger/10">
                  {busy !== "delete" && <Trash2 />} Delete
                </Button>
              </div>
              {actionError && (
                <p role="alert" className="text-sm text-danger">
                  {actionError}
                </p>
              )}
              {d.extracted.notes?.map((n) => (
                <p key={n} className="text-sm text-muted-foreground">
                  {n}
                </p>
              ))}
              <div className="relative min-h-0 flex-1">
                <pre
                  tabIndex={0}
                  aria-label="Extracted parameters as JSON"
                  className="max-h-[26rem] overflow-auto rounded-xl border border-border bg-background/60 p-4 font-mono text-xs leading-relaxed"
                >
                  {JSON.stringify(d.extracted, null, 2)}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute right-2 top-2"
                  onClick={async () => {
                    await navigator.clipboard.writeText(JSON.stringify(d.extracted, null, 2));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
