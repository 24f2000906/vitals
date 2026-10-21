"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useWorkspace } from "@/components/app/workspace";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const ACCEPT = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_MB = 20;

interface Item {
  key: string;
  name: string;
  state: "uploading" | "done" | "error";
  message?: string;
}

export function Dropzone() {
  const { members, activeMemberId, memberName, refreshDocuments } = useWorkspace();
  const [target, setTarget] = useState<number | null | "active">("active");
  const [over, setOver] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const memberId = target === "active" ? activeMemberId : target;

  const patch = (key: string, p: Partial<Item>) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...p } : i)));

  async function upload(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      const add = (state: Item["state"], message?: string) => setItems((p) => [{ key, name: file.name, state, message }, ...p].slice(0, 6));
      if (!ACCEPT.includes(file.type)) {
        add("error", "Use a PDF, PNG, JPG or WEBP file");
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        add("error", `Larger than ${MAX_MB} MB`);
        continue;
      }
      add("uploading");
      try {
        await api.uploadDocument(file, memberId);
        patch(key, { state: "done" });
        await refreshDocuments();
      } catch (e) {
        patch(key, { state: "error", message: e instanceof Error ? e.message : "Upload failed" });
      }
    }
  }

  return (
    <section aria-label="Upload documents" className="space-y-4">
      <motion.div
        animate={{ scale: over ? 1.01 : 1 }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-input bg-card/50 px-6 py-10 text-center transition-colors",
          over && "border-primary bg-muted/60",
        )}
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-muted text-primary">
          <UploadCloud className="size-7" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold">Drop reports and scans here</p>
          <p className="mt-1 text-sm text-muted-foreground">PDF, PNG, JPG or WEBP, up to {MAX_MB} MB each</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
          >
            Choose files
          </button>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Save to
            <div className="w-40">
              <Select
                value={String(target === "active" ? (activeMemberId ?? "me") : (target ?? "me"))}
                onChange={(e) => setTarget(e.target.value === "me" ? null : Number(e.target.value))}
                className="h-10"
              >
                <option value="me">{memberName(null)} (you)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          </label>
        </div>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT.join(",")}
          className="sr-only"
          aria-label="Choose files to upload"
          onChange={(e) => {
            if (e.target.files) void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </motion.div>
      {items.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-3 rounded-xl bg-card/70 px-4 py-2.5 text-sm">
              {i.state === "uploading" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              {i.state === "done" && <CheckCircle2 className="size-4 text-ok" />}
              {i.state === "error" && <XCircle className="size-4 text-danger" />}
              <span className="min-w-0 flex-1 truncate">{i.name}</span>
              <span className={cn("text-xs", i.state === "error" ? "text-danger" : "text-muted-foreground")}>
                {i.state === "uploading" ? "Uploading" : i.state === "done" ? "Uploaded" : i.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
