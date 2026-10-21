import { cn } from "@/lib/utils";
import Image from "next/image";
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-[0.12em]", className)}>
    <Image src="/logo.png" width={35} height={35} alt="V" />
      {!compact && <span>VITALS</span>}
      {compact && <span className="sr-only">VITALS</span>}
    </span>
  );
}
