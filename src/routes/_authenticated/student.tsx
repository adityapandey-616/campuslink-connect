import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Briefcase, FileText, LayoutDashboard, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getMyRoles, homeFor } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/student")({
  beforeLoad: async () => {
    const roles = await getMyRoles();
    if (!roles.includes("student")) throw redirect({ to: homeFor(roles) });
  },
  head: () => ({ meta: [{ title: "Student — CAMPUSLINK" }] }),
  component: () => (
    <AppShell
      roleLabel="Student"
      nav={[
        { to: "/student", label: "Dashboard", icon: LayoutDashboard },
        { to: "/student/opportunities", label: "Opportunities", icon: Briefcase },
        { to: "/student/applications", label: "Applications & Offers", icon: FileText },
        { to: "/student/profile", label: "Profile & Skills", icon: UserRound },
      ]}
    >
      <Outlet />
    </AppShell>
  ),
});
