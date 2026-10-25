import { cn } from "@/lib/utils";
import { Audiowide } from "next/font/google";
import Link from "next/link";

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
});

export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href="/"  aria-label="Vitals home" 
      className={cn(
        "inline-flex items-center gap-0 text-xl md:text-2xl font-bold",
        className
      )}
    >
      <img className="h-8 md:h-10" src="/logo.png" alt="Vitals" />

      {!compact && (
        <span className={audiowide.className}>VITALS</span>
      )}

      {compact && <span className="sr-only">VITALS</span>}
    </Link>
  );
}