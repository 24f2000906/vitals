"use client";
import { FolderLock, LayoutDashboard, ScrollText, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timeline", label: "Timeline", icon: ScrollText },
  { href: "/documents", label: "Vault", icon: FolderLock },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="glass fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-x-0 border-b-0 border-t border-border/50 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors",
              active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <span className="absolute -top-1.5 h-1 w-7 rounded-full bg-primary" />
            )}
            <Icon className={cn("size-5 transition-transform", active && "scale-110")} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
