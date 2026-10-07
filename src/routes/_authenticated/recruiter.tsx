import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Briefcase, PlusCircle, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getMyRoles, homeFor } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/recruiter")({
  head: () => ({ meta: [{ title: "Recruiter — CAMPUSLINK" }] }),
  component: () => (
    <AppShell
      roleLabel="Recruiter"
      nav={[
        { to: "/recruiter", label: "Jobs & Pipeline", icon: Briefcase },
        { to: "/recruiter/discover", label: "Candidate Discovery", icon: Users },
        { to: "/recruiter/new-job", label: "Create Job", icon: PlusCircle },
      ]}
    >
      <Outlet />
    </AppShell>
  ),
});
