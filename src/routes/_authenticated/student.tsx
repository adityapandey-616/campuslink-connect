import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Bell, Briefcase, ClipboardList, FileText, GraduationCap, LayoutDashboard, TrendingUp, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/student")({
  head: () => ({ meta: [{ title: "Student — CAMPUSLINK" }] }),
  component: () => (
    <AppShell
      roleLabel="Student"
      nav={[
        { to: "/student", label: "Dashboard", icon: LayoutDashboard },
        { to: "/student/opportunities", label: "Opportunities", icon: Briefcase },
        { to: "/student/applications", label: "Applications & Offers", icon: ClipboardList },
        { to: "/student/drives", label: "Placement Drives", icon: GraduationCap },
        { to: "/student/insights", label: "Skill Insights", icon: TrendingUp },
        { to: "/student/profile", label: "Profile & Skills", icon: UserRound },
      ]}
    >
      <Outlet />
    </AppShell>
  ),
});
