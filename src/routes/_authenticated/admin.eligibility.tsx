import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  GraduationCap,
  HelpCircle,
  Search,
  Sparkles,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Empty, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getAdminStudents,
  getCandidateEligibilityDetails,
} from "@/lib/admin-data";
import {
  getMockJobs,
  getMockApplications,
  updateMockApplicationStatus,
  type MockJob,
  type MockCandidate,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/eligibility")({
  head: () => ({ meta: [{ title: "Eligibility & Shortlisting — CAMPUSLINK Admin" }] }),
  component: AdminEligibilityPage,
});

export function AdminEligibilityPage() {
  const jobs = useMemo(() => getMockJobs(), []);
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id ?? "j1");
  const [students] = useState<MockCandidate[]>(() => getAdminStudents());
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"eligible" | "ineligible" | "all">("eligible");
  const [branchFilter, setBranchFilter] = useState("all");

  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId) ?? jobs[0]!;
  }, [jobs, selectedJobId]);

  // Compute eligibility for all students against selected job
  const candidateEvaluations = useMemo(() => {
    return students.map((s) => getCandidateEligibilityDetails(s, selectedJob));
  }, [students, selectedJob]);

  const eligibleList = useMemo(() => candidateEvaluations.filter((c) => c.isEligible), [candidateEvaluations]);
  const ineligibleList = useMemo(() => candidateEvaluations.filter((c) => !c.isEligible), [candidateEvaluations]);

  const currentList = useMemo(() => {
    let list = tab === "eligible" ? eligibleList : tab === "ineligible" ? ineligibleList : candidateEvaluations;

    return list.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.student.full_name.toLowerCase().includes(q) ||
        c.student.roll_no.toLowerCase().includes(q) ||
        c.student.branch.toLowerCase().includes(q);

      const matchesBranch = branchFilter === "all" || c.student.branch === branchFilter;
      return matchesSearch && matchesBranch;
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [tab, eligibleList, ineligibleList, candidateEvaluations, search, branchFilter]);

  const handleBulkShortlist = () => {
    const apps = getMockApplications();
    let count = 0;

    eligibleList.forEach((e) => {
      const existing = apps.find((a) => a.student_id === e.student.id && a.job_id === selectedJob.id);
      if (existing) {
        updateMockApplicationStatus(existing.id, "shortlisted");
        count++;
      }
    });

    toast.success(
      `Shortlisted ${count || eligibleList.length} eligible candidates for ${selectedJob.title} at ${selectedJob.company.name}!`
    );
  };

  const handleExportShortlist = () => {
    toast.success(`Exported shortlist for ${selectedJob.title} (${eligibleList.length} candidates)`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Eligibility Verification & Shortlisting"
        subtitle="Explainable rule-checking engine across cutoff CGPA, branch criteria, backlog barriers, and required tech skills."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportShortlist}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" /> Export Shortlist
            </Button>
            <Button
              size="sm"
              onClick={handleBulkShortlist}
              className="gap-1.5 shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-accent" /> One-Click Shortlist ({eligibleList.length})
            </Button>
          </div>
        }
      />

      {/* Opportunity Selector Card */}
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
              Select Recruitment Drive / Job Role
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="h-10 rounded-md border bg-card px-3 text-sm font-semibold text-foreground"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} · {j.company.name} (₹{j.ctc_lpa} LPA)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Criteria Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="py-1 px-2.5">
              Cutoff: ≥ {selectedJob.min_cgpa} CGPA
            </Badge>
            <Badge variant="outline" className="py-1 px-2.5">
              Max Backlogs: {selectedJob.max_backlogs}
            </Badge>
            <Badge variant="secondary" className="py-1 px-2.5">
              Branches: {selectedJob.eligible_branches.join(", ")}
            </Badge>
            <Badge variant="secondary" className="py-1 px-2.5">
              Skills: {selectedJob.skills.map((s) => s.name).join(", ")}
            </Badge>
          </div>
        </div>

        {/* Evaluation Summary Strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t text-xs">
          <div className="rounded-lg bg-secondary/40 p-2.5 text-center">
            <div className="text-muted-foreground">Total Cohort Evaluated</div>
            <div className="text-lg font-bold text-foreground mt-0.5">{students.length}</div>
          </div>
          <div className="rounded-lg bg-success/10 border border-success/20 p-2.5 text-center">
            <div className="text-success font-medium">Eligible Candidates</div>
            <div className="text-lg font-bold text-success mt-0.5">{eligibleList.length}</div>
          </div>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-center">
            <div className="text-destructive font-medium">Ineligible / Blocked</div>
            <div className="text-lg font-bold text-destructive mt-0.5">{ineligibleList.length}</div>
          </div>
          <div className="rounded-lg bg-accent/10 border border-accent/20 p-2.5 text-center">
            <div className="text-accent font-medium">Eligibility Ratio</div>
            <div className="text-lg font-bold text-accent mt-0.5">
              {Math.round((eligibleList.length / Math.max(students.length, 1)) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 text-xs">
          <button
            onClick={() => setTab("eligible")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === "eligible" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Eligible Only ({eligibleList.length})
          </button>
          <button
            onClick={() => setTab("ineligible")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === "ineligible" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ineligible / Blocked ({ineligibleList.length})
          </button>
          <button
            onClick={() => setTab("all")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === "all" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Candidates ({candidateEvaluations.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate..."
              className="pl-8 h-8 text-xs w-48 sm:w-60"
            />
          </div>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="h-8 rounded-md border bg-card px-2 text-xs text-foreground"
          >
            <option value="all">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EE">EE</option>
            <option value="ME">ME</option>
          </select>
        </div>
      </div>

      {/* Candidate Breakdown Cards */}
      {currentList.length === 0 ? (
        <Empty>No candidates in this eligibility view.</Empty>
      ) : (
        <div className="space-y-3">
          {currentList.map(({ student, isEligible, matchScore, readinessScore, reasons, blockers, matchedSkills, missingSkills }) => (
            <div
              key={student.id}
              className={`rounded-xl border p-4.5 transition-colors ${
                isEligible
                  ? "bg-card border-border hover:border-accent/40"
                  : "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-full font-bold flex items-center justify-center shrink-0 ${
                      isEligible
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {student.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{student.full_name}</span>
                      <span className="font-mono text-xs text-muted-foreground">({student.roll_no})</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {student.branch}
                      </Badge>
                      {isEligible ? (
                        <Badge variant="default" className="bg-success text-primary-foreground text-[10px] py-0 px-2 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Eligible
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] py-0 px-2 gap-1">
                          <XCircle className="h-3 w-3" /> Ineligible
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>CGPA: <strong className="text-foreground">{student.cgpa}</strong></span>
                      <span>Backlogs: <strong className="text-foreground">{student.backlogs}</strong></span>
                      <span>Readiness: <strong className="text-accent">{readinessScore}%</strong></span>
                      <span>Match Score: <strong className="text-foreground">{matchScore}%</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isEligible ? "default" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => {
                      toast.success(
                        isEligible
                          ? `${student.full_name} added to shortlist for ${selectedJob.title}`
                          : `Admin manual override applied for ${student.full_name}`
                      );
                    }}
                  >
                    {isEligible ? "Shortlist Candidate" : "Manual Override"}
                  </Button>
                </div>
              </div>

              {/* Explainability Breakdown Strip */}
              <div className="mt-3.5 grid gap-3 pt-3 border-t sm:grid-cols-2 text-xs">
                {/* Met Requirements */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-foreground/80 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Qualification Indicators
                  </div>
                  {reasons.length === 0 ? (
                    <div className="text-muted-foreground text-[11px]">No matching criteria fulfilled.</div>
                  ) : (
                    <ul className="space-y-1 text-[11px] text-muted-foreground">
                      {reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-success font-bold">✓</span> {r}
                        </li>
                      ))}
                    </ul>
                  )}
                  {matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {matchedSkills.map((m) => (
                        <span key={m.id} className="rounded bg-success/10 text-success px-1.5 py-0.5 text-[10px] font-medium">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blockers or Missing Skills */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-foreground/80 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Blockers & Skill Gaps
                  </div>
                  {blockers.length === 0 && missingSkills.length === 0 ? (
                    <div className="text-success text-[11px] font-medium">No criteria blockers found — 100% compliant.</div>
                  ) : (
                    <ul className="space-y-1 text-[11px] text-muted-foreground">
                      {blockers.map((b, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-destructive font-medium">
                          <span className="font-bold">✗</span> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {missingSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[10px] text-muted-foreground mr-1">Missing:</span>
                      {missingSkills.map((m) => (
                        <span key={m.id} className="rounded bg-destructive/10 text-destructive px-1.5 py-0.5 text-[10px]">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
