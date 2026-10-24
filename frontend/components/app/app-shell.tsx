"use client";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth-provider";
import { Logo } from "../logo";
import { ThemeToggle } from "../theme-toggle";
import { DesktopSidebar, MobileDrawer } from "./sidebar";
import { MobileBottomNav } from "./bottom-nav";
import { WorkspaceProvider, useWorkspace } from "./workspace";
import { initials } from "@/lib/utils";

function MobileHeader({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { activeName } = useWorkspace();
  return (
    <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-x-0 border-t-0 px-3.5 sm:px-4 md:hidden backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open family menu"
          className="grid size-9 place-items-center rounded-lg text-foreground hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
        <Logo />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/70 py-1 pl-1 pr-2.5 text-xs font-medium text-foreground hover:bg-muted transition"
          title="Switch family member"
        >
          <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {initials(activeName)}
          </span>
          <span className="max-w-[76px] truncate font-medium">{activeName}</span>
        </button>
      </div>
    </header>
  );
}

function AppShellContent({ children, isReady }: { children: ReactNode; isReady: boolean }) {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} />
      <div className="min-w-0 flex-1 overflow-x-clip">
        <MobileHeader onOpenDrawer={() => setDrawer(true)} />
        <main className="mx-auto w-full max-w-6xl px-3.5 py-6 sm:px-8 sm:py-8 md:py-10 pb-24 md:pb-10">
          {!isReady ? (
            <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground" role="status">
              Opening your vault…
            </div>
          ) : null}
          <div className={!isReady ? "hidden" : undefined}>{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anon") router.replace("/auth/signin");
    else if (status === "authed" && user && !user.setup_complete) router.replace("/auth/setup");
  }, [status, user, router]);

  const isReady = status === "authed" && Boolean(user?.setup_complete);

  return (
    <WorkspaceProvider>
      <AppShellContent isReady={isReady}>{children}</AppShellContent>
    </WorkspaceProvider>
  );
}
