import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, CalendarDays, FileCheck2, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getMyRoles, homeFor } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const roles = await getMyRoles();
    if (!roles.includes("admin")) throw redirect({ to: homeFor(roles) });
  },
  head: () => ({ meta: [{ title: "Placement Admin — CAMPUSLINK" }] }),
  component: () => (
    <AppShell
      roleLabel="Placement Admin"
      nav={[
        { to: "/admin", label: "Analytics", icon: BarChart3 },
        { to: "/admin/attention", label: "Needs Attention", icon: AlertTriangle },
        { to: "/admin/drives", label: "Placement Drives", icon: CalendarDays },
        { to: "/admin/documents", label: "Documents", icon: FileCheck2 },
        { to: "/recruiter", label: "Recruiter view", icon: Users },
      ]}
    >
      <Outlet />
    </AppShell>
  ),
});
