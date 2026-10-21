import type * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-input bg-card/70 px-3.5 text-sm transition-shadow placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/40",
        className,
      )}
      {...props}
    />
  );
}
