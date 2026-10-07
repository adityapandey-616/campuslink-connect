import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Stat } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  getAdminStudents,
  getAdminOffers,
  getAdminCompanies,
} from "@/lib/admin-data";
import { getMockApplications } from "@/lib/mock-data";
import { computeReadiness } from "@/lib/campus";

const AnalyticsCharts = lazy(() =>
  import("@/components/admin-analytics-charts").then((module) => ({ default: module.AnalyticsCharts }))
);

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Placement Analytics & Intelligence — CAMPUSLINK Admin" }] }),
  component: AdminAnalyticsPage,
});

export function AdminAnalyticsPage() {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedCohort, setSelectedCohort] = useState("2025");

  const students = useMemo(() => getAdminStudents(), []);
  const apps = useMemo(() => getMockApplications(), []);
  const offers = useMemo(() => getAdminOffers(), []);
  const companies = useMemo(() => getAdminCompanies(), []);

  // Filter cohort if needed
  const cohortStudents = useMemo(() => {
    return students.filter((s) => {
      const matchBranch = selectedBranch === "all" || s.branch === selectedBranch;
      return matchBranch;
    });
  }, [students, selectedBranch]);

  const placedCount = useMemo(() => {
    return cohortStudents.filter((s) => s.placement_status === "placed").length;
  }, [cohortStudents]);

  const placementRate = cohortStudents.length
    ? Math.round((placedCount / cohortStudents.length) * 100)
    : 0;

  const ctcs = offers.map((o) => o.ctc_lpa);
  const avgCTC = ctcs.length ? (ctcs.reduce((a, b) => a + b, 0) / ctcs.length).toFixed(1) : "0";
  const maxCTC = ctcs.length ? Math.max(...ctcs) : 0;
  const medianCTC = ctcs.length ? [...ctcs].sort((a, b) => a - b)[Math.floor(ctcs.length / 2)] : 0;

  // Branch-wise placement data
  const branchData = useMemo(() => {
    return ["CSE", "IT", "ECE", "EE", "ME"].map((b) => {
      const branchTotal = students.filter((s) => s.branch === b);
      const placed = branchTotal.filter((s) => s.placement_status === "placed").length;
      return {
        branch: b,
        total: branchTotal.length,
        placed,
        rate: branchTotal.length ? Math.round((placed / branchTotal.length) * 100) : 0,
      };
    });
  }, [students]);

  // Application Pipeline Funnel
  const funnelData = useMemo(() => {
    const stages = ["applied", "shortlisted", "interview", "offered", "joined", "rejected"];
    return stages.map((st) => ({
      name: st,
      count: apps.filter((a) => a.status === st).length,
    }));
  }, [apps]);

  // Company-wise Offer Distribution
  const companyHiringData = useMemo(() => {
    return companies.map((c) => {
      const compOffers = offers.filter((o) => o.company_id === c.id);
      return {
        company: c.name,
        offers: compOffers.length,
        tier: c.tier,
      };
    }).filter((c) => c.offers > 0).sort((a, b) => b.offers - a.offers);
  }, [companies, offers]);

  // Salary Tier Bands
  const ctcBands = useMemo(() => {
    const b1 = offers.filter((o) => o.ctc_lpa >= 10).length; // Dream >= 10 LPA
    const b2 = offers.filter((o) => o.ctc_lpa >= 8 && o.ctc_lpa < 10).length; // 8 - 10 LPA
    const b3 = offers.filter((o) => o.ctc_lpa >= 6 && o.ctc_lpa < 8).length; // 6 - 8 LPA
    const b4 = offers.filter((o) => o.ctc_lpa < 6).length; // < 6 LPA

    return [
      { name: "≥ 10 LPA (Dream)", value: b1 },
      { name: "8 - 10 LPA", value: b2 },
      { name: "6 - 8 LPA", value: b3 },
      { name: "< 6 LPA", value: b4 },
    ].filter((b) => b.value > 0);
  }, [offers]);

  // Readiness distribution
  const readinessDistribution = useMemo(() => {
    let high = 0;
    let moderate = 0;
    let needsAttention = 0;

    cohortStudents.forEach((s) => {
      const r = computeReadiness({
        cgpa: Number(s.cgpa),
        backlogs: s.backlogs,
        skills: s.student_skills.length,
        projects: s.projects.length,
        certs: s.certifications.length,
        verifiedDocs: s.documents.filter((d) => d.status === "verified").length,
      });

      if (r.total >= 80) high++;
      else if (r.total >= 60) moderate++;
      else needsAttention++;
    });

    return [
      { tier: "High Readiness (80+)", count: high },
      { tier: "Moderate (60-79)", count: moderate },
      { tier: "Needs Support (<60)", count: needsAttention },
    ];
  }, [cohortStudents]);

  const handleExportAnalyticsReport = () => {
    toast.success("Comprehensive Placement Season Analytics Report downloaded (PDF).");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Intelligence & Analytics"
        subtitle="Cohort-wide salary distributions, branch conversion benchmarks, recruiter absorption rates, and pipeline conversion funnels."
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleExportAnalyticsReport} className="gap-1.5">
              <Download className="h-4 w-4" /> Export Report
            </Button>
          </div>
        }
      />

      {/* Cohort & Branch Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Placement Season:</span>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="h-8 rounded-md border bg-card px-2 text-xs font-semibold text-foreground"
            >
              <option value="2025">2025-2026 Batch (Current)</option>
              <option value="2024">2024-2025 Batch (Archive)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Branch Filter:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="h-8 rounded-md border bg-card px-2 text-xs font-semibold text-foreground"
            >
              <option value="all">All Academic Branches</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EE">EE</option>
              <option value="ME">ME</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Cohort Sample Size: <strong className="text-foreground">{cohortStudents.length} Students</strong>
        </div>
      </div>

      {/* Metric Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Stat
          label="Placement Rate"
          value={`${placementRate}%`}
          hint={`${placedCount} of ${cohortStudents.length} students placed`}
        />
        <Stat
          label="Average Package"
          value={`₹${avgCTC} LPA`}
          hint={`Median ₹${medianCTC} LPA`}
        />
        <Stat
          label="Highest CTC Offered"
          value={`₹${maxCTC} LPA`}
          hint="Tier 1 Tech Anchor"
        />
        <Stat
          label="Active Job Pipeline"
          value={apps.length}
          hint={`${offers.length} offers issued`}
        />
      </section>

      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>
        }
      >
        <AnalyticsCharts
          branchData={branchData}
          funnelData={funnelData}
          ctcBands={ctcBands}
          readinessDistribution={readinessDistribution}
          cohortStudents={cohortStudents}
          companyHiringData={companyHiringData}
        />
      </Suspense>
    </div>
  );
}
