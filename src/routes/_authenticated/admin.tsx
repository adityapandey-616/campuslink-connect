import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Placement Admin — Skill to Hire" }] }),
  component: () => (
    <AppShell
      roleLabel="Placement Admin"
      nav={[
        { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin/students", label: "Students", icon: GraduationCap },
        { to: "/admin/companies", label: "Companies", icon: Building2 },
        { to: "/admin/drives", label: "Placement Drives", icon: CalendarDays },
        { to: "/admin/eligibility", label: "Eligibility & Shortlist", icon: SlidersHorizontal },
        { to: "/admin/interviews", label: "Interviews", icon: CalendarCheck },
        { to: "/admin/applications", label: "Applications", icon: BriefcaseBusiness },
        { to: "/admin/documents", label: "Offers & Documents", icon: FileCheck2 },
        { to: "/admin/notifications", label: "Notifications", icon: Bell },
        { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { to: "/admin/settings", label: "Settings", icon: Settings },
      ]}
    >
      <Outlet />
    </AppShell>
  ),
});

