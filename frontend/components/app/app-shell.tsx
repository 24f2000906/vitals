"use client";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth-provider";
import { Logo } from "../logo";
import { DesktopSidebar, MobileDrawer } from "./sidebar";
import { WorkspaceProvider } from "./workspace";

export function AppShell({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (status === "anon") router.replace("/auth/signin");
    else if (status === "authed" && user && !user.setup_complete) router.replace("/auth/setup");
  }, [status, user, router]);

  const isReady = status === "authed" && Boolean(user?.setup_complete);

  return (
    <WorkspaceProvider>
      {/* No overflow on this tree: the report page's sticky horizontal track needs the window to scroll. */}
      <div className="flex min-h-screen">
        <DesktopSidebar />
        <MobileDrawer open={drawer} onClose={() => setDrawer(false)} />
        <div className="min-w-0 flex-1 overflow-x-clip">
          <header className="glass sticky top-0 z-30 flex h-14 items-center gap-3 border-x-0 border-t-0 px-4 md:hidden">
            <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-lg hover:bg-muted">
              <Menu className="size-5" />
            </button>
            <Logo />
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 md:py-10">
            {!isReady ? (
              <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground" role="status">
                Opening your vault…
              </div>
            ) : null}
            <div className={!isReady ? "hidden" : undefined}>{children}</div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
