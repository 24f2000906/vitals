"use client";
import { AnimatePresence, motion } from "framer-motion";
import { FolderLock, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Plus, ScrollText, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "../auth-provider";
import { Logo } from "../logo";
import { ThemeToggle } from "../theme-toggle";
import { AddMemberDialog } from "./add-member-dialog";
import { useWorkspace } from "./workspace";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timeline", label: "Health timeline", icon: ScrollText },
  { href: "/documents", label: "Documents vault", icon: FolderLock },
  { href: "/profile", label: "Health profile", icon: UserRound },
];

function Avatar({ name, active, onClick, label }: { name: string; active: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold transition-all hover:scale-105",
        active && "bg-primary text-primary-foreground ring-2 ring-accent ring-offset-2 ring-offset-card",
      )}
    >
      {initials(name)}
    </button>
  );
}

export function SidebarBody({ collapsed, onNavigate, onToggle }: { collapsed: boolean; onNavigate?: () => void; onToggle?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { members, activeMemberId, setActiveMemberId, memberName } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const meName = user?.full_name ?? "You";

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "justify-between")}>
        <Logo compact={collapsed} />
        <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
          {!collapsed && <ThemeToggle />}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          )}
        </div>
      </div>

      <nav aria-label="Main" className="space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                collapsed && "justify-center px-0",
                active && "text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId={collapsed ? "nav-pill-c" : "nav-pill"}
                  className="absolute inset-0 rounded-xl bg-accent/25"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative size-4.5 shrink-0" />
              {!collapsed && <span className="relative truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <section aria-label="Family members" className="min-h-0 flex-1 overflow-y-auto">
        {!collapsed && <h2 className="mb-3 px-1 text-sm font-semibold">Family</h2>}
        <div className={cn("flex gap-2.5", collapsed ? "flex-col items-center" : "flex-wrap px-1")}>
          <Avatar name={meName} label={`${meName} (you)`} active={activeMemberId === null} onClick={() => setActiveMemberId(null)} />
          {members.map((m) => (
            <Avatar key={m.id} name={m.name} label={`${m.name}, ${m.relationship}`} active={activeMemberId === m.id} onClick={() => setActiveMemberId(m.id)} />
          ))}
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add member"
            title="Add member"
            className="grid size-9 place-items-center rounded-full border border-dashed border-input text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {!collapsed && (
          <p className="mt-3 px-1 text-xs text-muted-foreground">
            Viewing <span className="font-medium text-foreground">{memberName(activeMemberId)}</span>
          </p>
        )}
      </section>

      <div className={cn("flex items-center gap-3 border-t border-border pt-4", collapsed && "flex-col")}>
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{initials(meName)}</div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{meName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={signOut}
          aria-label="Log out"
          title="Log out"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <LogOut className="size-4" />
        </button>
      </div>
      <AddMemberDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

export function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 288 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="glass sticky top-0 hidden h-screen shrink-0 overflow-hidden border-y-0 border-l-0 md:block"
    >
      <SidebarBody collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
    </motion.aside>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card shadow-2xl md:hidden"
          >
            <SidebarBody collapsed={false} onNavigate={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
