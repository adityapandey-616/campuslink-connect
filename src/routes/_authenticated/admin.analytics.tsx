import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading, PageHeader, Stat } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { AnalyticsCharts } from "@/components/admin-analytics-charts";
import { adminOverviewQuery } from "@/lib/admin-live-data";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Placement Analytics — Skill to Hire Admin" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const overview = useQuery(adminOverviewQuery);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  const data = overview.data;
  const branches = useMemo(
    () =>
      [...new Set((data?.students ?? []).map((student) => student.branch).filter(Boolean))].sort(),
    [data?.students],
  );
  const years = useMemo(
    () =>
      [
        ...new Set(
          (data?.students ?? [])
            .map((student) => student.graduation_year)
            .filter((year) => year !== null),
        ),
      ].sort((a, b) => b - a),
    [data?.students],
  );

  const cohort = useMemo(
    () =>
      (data?.students ?? []).filter(
        (student) =>
          (selectedBranch === "all" || student.branch === selectedBranch) &&
          (selectedYear === "all" || String(student.graduation_year) === selectedYear),
      ),
    [data?.students, selectedBranch, selectedYear],
  );
  const cohortProfileIds = useMemo(() => new Set(cohort.map((student) => student.id)), [cohort]);
  const cohortApplications = useMemo(
    () =>
      (data?.applications ?? []).filter(
        (application) =>
          application.profile_id !== null && cohortProfileIds.has(application.profile_id),
      ),
    [data?.applications, cohortProfileIds],
  );
  const cohortApplicationIds = useMemo(
    () => new Set(cohortApplications.map((application) => application.id)),
    [cohortApplications],
  );
  const cohortOffers = useMemo(
    () =>
      (data?.offers ?? []).filter(
        (offer) => offer.application_id !== null && cohortApplicationIds.has(offer.application_id),
      ),
    [data?.offers, cohortApplicationIds],
  );

  if (overview.isLoading) return <Loading />;
  if (overview.error || !data) {
    return (
      <Empty>
        Live analytics could not be loaded:{" "}
        {overview.error instanceof Error ? overview.error.message : "No data returned"}
      </Empty>
    );
  }

  const cohortBranches = [...new Set(cohort.map((student) => student.branch ?? "Unspecified"))];
  const branchData = cohortBranches.map((branch) => ({
    branch,
    students: cohort.filter((student) => (student.branch ?? "Unspecified") === branch).length,
  }));
  const applicationStatuses = [
    "applied",
    "shortlisted",
    "interview",
    "offered",
    "joined",
    "rejected",
  ];
  const applicationStatusData = applicationStatuses.map((status) => ({
    status,
    count: cohortApplications.filter((application) => application.status === status).length,
  }));
  const interviewStatuses = [
    ...new Set(data.interviews.map((interview) => interview.status)),
  ].sort();
  const interviewStatusData = interviewStatuses.map((status) => ({
    status,
    count: data.interviews.filter((interview) => interview.status === status).length,
  }));
  const companyOpportunityData = data.companies
    .map((company) => ({
      company: company.name,
      opportunities: data.opportunities.filter(
        (opportunity) => opportunity.company_id === company.id,
      ).length,
    }))
    .filter((row) => row.opportunities > 0)
    .sort((a, b) => b.opportunities - a.opportunities)
    .slice(0, 10);

  const exportCsv = () => {
    const rows = [
      ["metric", "value"],
      ["cohort_students", String(cohort.length)],
      ["cohort_applications", String(cohortApplications.length)],
      ["cohort_offers", String(cohortOffers.length)],
      ...applicationStatusData.map(({ status, count }) => [
        `applications_${status}`,
        String(count),
      ]),
      ...interviewStatusData.map(({ status, count }) => [`interviews_${status}`, String(count)]),
    ];
    const content = rows
      .map((row) => row.map((field) => `"${field.replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "skill-to-hire-live-analytics.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Analytics"
        subtitle="Counts are derived from live records visible under current RLS policies. Unsupported placement and salary measures are intentionally omitted."
        action={
          <Button size="sm" variant="secondary" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export live counts
          </Button>
        }
      />

      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <select
          value={selectedBranch}
          onChange={(event) => setSelectedBranch(event.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All branches</option>
          {branches.map((branch) => (
            <option key={branch} value={branch ?? ""}>
              {branch}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(event) => setSelectedYear(event.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All graduation years</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Cohort profiles" value={cohort.length} hint="Filtered by branch/year" />
        <Stat label="Applications" value={cohortApplications.length} hint="For selected profiles" />
        <Stat label="Offers" value={cohortOffers.length} hint="Linked to selected applications" />
        <Stat label="Companies" value={data.companies.length} hint="Live company records" />
      </section>

      <AnalyticsCharts
        branchData={branchData}
        applicationStatusData={applicationStatusData}
        interviewStatusData={interviewStatusData}
        companyOpportunityData={companyOpportunityData}
      />

      <section className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        This analytics query reads profiles, not the separate students relation represented in the
        generated types. Placement and academic eligibility are therefore not joined into these
        measures. Offers.salary has no known unit, so placement rate, readiness, eligibility, and
        salary-band analytics are not reported.
      </section>
    </div>
  );
}
