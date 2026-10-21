import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DocStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: DocStatus }) {
  if (status === "Parsed")
    return (
      <Badge tone="ok">
        <CheckCircle2 className="size-3.5" /> Parsed
      </Badge>
    );
  if (status === "Flagged")
    return (
      <Badge tone="warn">
        <AlertTriangle className="size-3.5" /> Flagged
      </Badge>
    );
  return (
    <Badge tone="neutral">
      <Loader2 className="size-3.5 animate-spin" /> Extracting
    </Badge>
  );
}
