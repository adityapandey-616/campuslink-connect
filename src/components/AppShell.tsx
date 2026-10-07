import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LogOut, Shield, User, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { getSession, logout } from "@/lib/auth-store";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function AppShell({ nav, roleLabel, children }: { nav: NavItem[]; roleLabel: string; children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const session = getSession();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    try {
      await supabase.auth.signOut();
    } catch {}
    logout();
    toast.info("Logged out successfully.");
    navigate({ to: "/auth", replace: true });
  }

  function handleSwitchPortal(targetRole: "student" | "admin" | "recruiter") {
    if (session?.role !== targetRole) {
      toast.warning(`Switching to ${targetRole.toUpperCase()} requires ${targetRole} authentication.`);
      navigate({ to: "/auth", search: { role: targetRole, redirect: `/${targetRole}` } });
    } else {
      navigate({ to: `/${targetRole}` as any });
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Logo inverted />
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
              <span className="text-xs uppercase tracking-wider text-sidebar-foreground/80 font-medium truncate">
                {roleLabel}
              </span>
            </div>
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent shrink-0">
              Session Active
            </span>
          </div>
          {session?.name && (
            <div className="mt-2 text-[11px] text-sidebar-foreground/60 flex items-center gap-1.5 truncate">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{session.name}</span>
            </div>
          )}
        </div>

        {/* Portal Quick Switcher with Role Guard */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 px-2 mb-1.5">
            Switch Portal
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-md bg-sidebar-accent/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleSwitchPortal("student")}
              className={`rounded px-1.5 py-1 text-center font-medium transition-colors ${
                session?.role === "student"
                  ? "bg-sidebar-accent text-accent font-semibold shadow-xs"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleSwitchPortal("admin")}
              className={`rounded px-1.5 py-1 text-center font-medium transition-colors ${
                session?.role === "admin"
                  ? "bg-sidebar-accent text-accent font-semibold shadow-xs"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleSwitchPortal("recruiter")}
              className={`rounded px-1.5 py-1 text-center font-medium transition-colors ${
                session?.role === "recruiter"
                  ? "bg-sidebar-accent text-accent font-semibold shadow-xs"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              Recruiter
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-auto">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
            >
              <n.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{n.label}</span>
            </Link>
          ))}
        </nav>

        <div className="m-3 space-y-1">
          <Link to="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
            Back to Home
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-muted-foreground">Home</Link>
            <button onClick={signOut} className="text-xs text-muted-foreground">Exit</button>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-2 py-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground" activeProps={{ className: "bg-secondary text-foreground font-medium" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Loading() {
  return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>;
}
