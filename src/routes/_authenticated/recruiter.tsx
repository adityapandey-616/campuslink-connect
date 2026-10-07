import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BriefcaseBusiness, Building2, CalendarDays, FileText, LayoutDashboard, UserRoundSearch } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/recruiter")({
  head: () => ({ meta: [{ title: "Recruiter — CAMPUSLINK" }] }),
  component: () => (
    <AppShell
      roleLabel="Recruiter"
      nav={[
        { to: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/recruiter/discover", label: "Discover Candidates", icon: UserRoundSearch },
        { to: "/recruiter/jobs", label: "Jobs", icon: BriefcaseBusiness },
        { to: "/recruiter/applications", label: "Applications", icon: FileText },
        { to: "/recruiter/interviews", label: "Interviews", icon: CalendarDays },
        { to: "/recruiter/offers", label: "Offers", icon: BriefcaseBusiness },
        { to: "/recruiter/company", label: "Company Profile", icon: Building2 },
      ]}
    >
      <Outlet />
    </AppShell>
  ),
});
