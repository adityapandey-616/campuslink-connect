import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LogOut, User, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { getDemoPreviewRole, getSession, logout, setDemoPreviewRole } from "@/lib/auth-store";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function AppShell({
  nav,
  roleLabel,
  children,
}: {
  nav: NavItem[];
  roleLabel: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const session = getSession();
  const previewRole = getDemoPreviewRole();
  const activePortalRole = previewRole ?? session?.role;
  const isAdminPortalActive =
    !previewRole && (session?.role === "admin" || session?.role === "placement_admin");

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("[AppShell] Sign-out cleanup warning:", error);
    }
    logout();
    toast.info("Logged out successfully.");
    navigate({ to: "/auth", replace: true });
  }

  function handleSwitchPortal(targetRole: "student" | "admin" | "recruiter") {
    const isPlacementStaff = session?.role === "admin" || session?.role === "placement_admin";
    if (isPlacementStaff) {
      const previewRole = targetRole === "admin" ? null : targetRole;
      if (!setDemoPreviewRole(previewRole)) {
        toast.error("Could not change portal preview mode. Please try again.");
        return;
      }

      navigate({
        to:
          targetRole === "admin"
            ? "/admin"
            : targetRole === "recruiter"
              ? "/recruiter/dashboard"
              : "/student",
      });
      return;
    }

    const alreadyHasTargetRole =
      targetRole === "admin"
        ? session?.role === "admin" || session?.role === "placement_admin"
        : session?.role === targetRole;
    if (!alreadyHasTargetRole) {
      toast.warning(
        `Switching to ${targetRole.toUpperCase()} requires ${targetRole} authentication.`,
      );
      navigate({ to: "/auth", search: { role: targetRole, redirect: `/${targetRole}` } });
    } else {
      const targetPath = `/${targetRole}` as "/student" | "/admin" | "/recruiter";
      navigate({ to: targetPath });
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 p-2.5 shadow-sm">
            <Logo inverted />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              <span className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/75">
                {roleLabel === "Placement Admin" && session?.role === "admin"
                  ? "Admin · Placement Admin"
                  : roleLabel}
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
        <div className="border-b border-sidebar-border p-3">
          <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
            Switch Portal
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-md bg-sidebar-accent/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleSwitchPortal("student")}
              className={`rounded px-1.5 py-1 text-center font-medium transition-colors ${
                activePortalRole === "student"
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
                isAdminPortalActive
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
                activePortalRole === "recruiter"
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
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              }}
            >
              <n.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{n.label}</span>
            </Link>
          ))}
        </nav>

        <div className="m-3 space-y-1 border-t border-sidebar-border pt-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
          >
            Back to Home
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Home
            </Link>
            <button
              onClick={signOut}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Exit
            </button>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card/95 px-2 py-2 backdrop-blur md:hidden">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground"
              activeProps={{ className: "bg-secondary text-foreground font-medium" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {previewRole && (
            <div
              role="status"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
            >
              <div>
                <div className="font-semibold text-amber-800 dark:text-amber-300">
                  Demo Preview — {previewRole === "student" ? "Student" : "Recruiter"} portal
                </div>
                <p className="text-xs text-muted-foreground">
                  Sample data only. This preview is read-only and does not change your account role.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSwitchPortal("admin")}
                className="rounded-md border border-amber-600/30 px-3 py-1.5 text-xs font-medium hover:bg-amber-500/10"
              >
                Return to Admin
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
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
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading content">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border bg-card" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl border bg-card" />
        <div className="h-72 animate-pulse rounded-xl border bg-card" />
      </div>
    </div>
  );
}
