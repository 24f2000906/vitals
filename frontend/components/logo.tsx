import { cn } from "@/lib/utils";
import Image from "next/image";
import { Audiowide } from "next/font/google";

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
    <span
      className={cn(
        "inline-flex items-center gap-1 text-2xl font-bold tracking-widest",
        className
      )}
    >
      <Image src="/logo.png" width={40} height={40} alt="V" />

      {!compact && (
        <span className={audiowide.className}>VITALS</span>
      )}

      {compact && <span className="sr-only">VITALS</span>}
    </span>
  );
}