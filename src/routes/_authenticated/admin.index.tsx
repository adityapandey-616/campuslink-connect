import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  GraduationCap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading, PageHeader, Stat } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminOverviewQuery } from "@/lib/admin-live-data";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Placement Admin Dashboard — Skill to Hire" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const overview = useQuery(adminOverviewQuery);

  if (overview.isLoading) return <Loading />;
  if (overview.error || !overview.data) {
    return (
      <Empty>
        Live admin records could not be loaded:{" "}
        {overview.error instanceof Error ? overview.error.message : "No data returned"}
      </Empty>
    );
  }

  const { students, recruiters, companies, opportunities, applications, interviews, offers } =
    overview.data;
  const now = Date.now();
  const upcomingInterviews = interviews
    .filter((interview) => interview.status === "scheduled")
    .filter((interview) => new Date(interview.scheduled_at).getTime() >= now)
    .slice(0, 5);
  const activeCompanies = companies.filter((company) => company.status === "active").length;
  const releasedOffers = offers.filter((offer) =>
    ["released", "accepted"].includes(offer.status.toLowerCase()),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Placement Overview"
        subtitle="Live counts and records visible under current RLS policies from profiles, companies, opportunities, applications, interviews, and offers."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/companies">
              <Button size="sm">
                <Building2 className="mr-2 h-4 w-4" />
                Manage companies
              </Button>
            </Link>
            <Link to="/admin/analytics">
              <Button size="sm" variant="outline">
                Live analytics
              </Button>
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Student profiles" value={students.length} hint="profiles.role = student" />
        <Stat
          label="Recruiter profiles"
          value={recruiters.length}
          hint="profiles.role = recruiter"
        />
        <Stat
          label="Companies"
          value={companies.length}
          hint={`${activeCompanies} marked active`}
        />
        <Stat label="Opportunities" value={opportunities.length} hint="Live opportunity records" />
        <Stat label="Applications" value={applications.length} hint="Live application records" />
        <Stat label="Interviews" value={interviews.length} hint="Live interview records" />
        <Stat
          label="Offers"
          value={offers.length}
          hint={`${releasedOffers} released or accepted`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <BriefcaseBusiness className="h-4 w-4 text-accent" />
              Application records
            </h2>
            <Link to="/admin/applications" className="text-xs text-accent hover:underline">
              View applications <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No application records found.</p>
          ) : (
            <div className="space-y-2">
              {applications.slice(0, 8).map((application) => (
                <div
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div>
                    <div className="font-medium">{application.student_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {application.company_name} · {application.opportunity_title}
                    </div>
                  </div>
                  <Badge variant="outline">{application.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarCheck className="h-4 w-4 text-accent" />
              Upcoming scheduled interviews
            </h2>
            <Link to="/admin/interviews" className="text-xs text-accent hover:underline">
              View interviews <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          {upcomingInterviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming scheduled interviews found.</p>
          ) : (
            <div className="space-y-2">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{interview.student_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(interview.scheduled_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {interview.company_name} · {interview.opportunity_title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <GraduationCap className="h-4 w-4" />
          Schema limitations
        </div>
        Placement drives are managed on the Placement Drives page and are not joined into these
        dashboard analytics. Private document access and salary units require manual verification.
      </section>
    </div>
  );
}
