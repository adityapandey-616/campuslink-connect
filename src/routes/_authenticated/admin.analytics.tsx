import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts";
import {
  Award,
  BarChart3,
  Building2,
  DollarSign,
  Download,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Stat } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAdminStudents,
  getAdminOffers,
  getAdminCompanies,
} from "@/lib/admin-data";
import { getMockApplications } from "@/lib/mock-data";
import { computeReadiness } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Placement Analytics & Intelligence — CAMPUSLINK Admin" }] }),
  component: AdminAnalyticsPage,
});

const PIE_COLORS = [
  "oklch(0.62 0.11 185)", // accent
  "oklch(0.26 0.05 255)", // primary
  "oklch(0.75 0.14 75)",  // warning
  "oklch(0.6 0.13 155)",  // success
  "oklch(0.577 0.22 27)", // destructive
  "oklch(0.5 0.02 255)",  // muted
];

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

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Branch-wise Placement Rate Bar Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-foreground">Branch-wise Placement Performance</h3>
              <p className="text-xs text-muted-foreground">Total enrolled students vs. placed candidates</p>
            </div>
            <GraduationCap className="h-5 w-5 text-accent" />
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={branchData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="branch" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} allowDecimals={false} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="total" fill="var(--chart-2)" name="Enrolled" radius={[4, 4, 0, 0]} />
              <Bar dataKey="placed" fill="var(--chart-1)" name="Placed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Application Stage Conversion Pipeline */}
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-foreground">Application Conversion Funnel</h3>
              <p className="text-xs text-muted-foreground">Progression across hiring rounds</p>
            </div>
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" fontSize={12} allowDecimals={false} stroke="var(--muted-foreground)" />
              <YAxis
                type="category"
                dataKey="name"
                width={85}
                fontSize={12}
                stroke="var(--muted-foreground)"
                tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} name="Candidates" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CTC Bracket Breakdown Pie Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-foreground">Salary Bracket Distribution (CTC)</h3>
              <p className="text-xs text-muted-foreground">Compensation bands across released offers</p>
            </div>
            <Award className="h-5 w-5 text-success" />
          </div>

          <div className="grid sm:grid-cols-2 items-center gap-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ctcBands}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {ctcBands.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 text-xs">
              {ctcBands.map((band, idx) => (
                <div key={band.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="font-medium text-foreground">{band.name}</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {band.value} offer{band.value > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Candidate AI Readiness Distribution */}
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-foreground">Cohort AI Readiness Spread</h3>
              <p className="text-xs text-muted-foreground">Distribution of student interview readiness scores</p>
            </div>
            <Sparkles className="h-5 w-5 text-accent" />
          </div>

          <div className="space-y-4 pt-2">
            {readinessDistribution.map((item) => {
              const pct = cohortStudents.length
                ? Math.round((item.count / cohortStudents.length) * 100)
                : 0;

              return (
                <div key={item.tier} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{item.tier}</span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{item.count}</strong> students ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.tier.includes("High")
                          ? "bg-success"
                          : item.tier.includes("Moderate")
                          ? "bg-accent"
                          : "bg-destructive"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Company-wise Hiring Table */}
        <div className="rounded-xl border bg-card p-5 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-foreground">Top Hiring Recruiter Partners</h3>
              <p className="text-xs text-muted-foreground">Volume of offers made per recruitment partner</p>
            </div>
            <Building2 className="h-5 w-5 text-accent" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground uppercase text-[11px] tracking-wider border-b">
                <tr>
                  <th className="p-3">Recruiting Company</th>
                  <th className="p-3">Hiring Tier</th>
                  <th className="p-3">Offers Released</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companyHiringData.map((c) => (
                  <tr key={c.company} className="hover:bg-muted/40">
                    <td className="p-3 font-semibold text-sm text-foreground">{c.company}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">{c.tier}</Badge>
                    </td>
                    <td className="p-3 font-bold text-accent text-sm">{c.offers}</td>
                    <td className="p-3">
                      <span className="text-success font-medium text-[11px] flex items-center gap-1">
                        Active Hiring Drive
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
