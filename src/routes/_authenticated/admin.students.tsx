import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Search,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAdminStudents,
  updateAdminStudentStatus,
} from "@/lib/admin-data";
import {
  MOCK_SKILLS,
  getMockApplications,
  getSkillById,
  type MockCandidate,
} from "@/lib/mock-data";
import { computeReadiness, statusStyles } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () => ({ meta: [{ title: "Student Management â€” Skill to Hire Admin" }] }),
  component: AdminStudentsPage,
});

function AdminStudentsPage() {
  const [students, setStudents] = useState<MockCandidate[]>(() => getAdminStudents());
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"cgpa-desc" | "readiness-desc" | "name-asc" | "roll-asc">("cgpa-desc");
  const [selectedStudent, setSelectedStudent] = useState<MockCandidate | null>(null);

  const applications = useMemo(() => getMockApplications(), []);

  // Compute readiness & stats for each student
  const studentRows = useMemo(() => {
    return students.map((s) => {
      const readiness = computeReadiness({
        cgpa: Number(s.cgpa),
        backlogs: s.backlogs,
        skills: s.student_skills.length,
        projects: s.projects.length,
        certs: s.certifications.length,
        verifiedDocs: s.documents.filter((d) => d.status === "verified").length,
      });

      const isEligible = Number(s.cgpa) >= 6.5 && s.backlogs === 0;
      const appCount = s.applications.length;

      return {
        ...s,
        readinessScore: readiness.total,
        readinessParts: readiness.parts,
        isEligible,
        appCount,
      };
    });
  }, [students]);

  // Filtered & Sorted List
  const filteredStudents = useMemo(() => {
    return studentRows.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.roll_no.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.branch.toLowerCase().includes(q);

      const matchesBranch = branchFilter === "all" || s.branch === branchFilter;
      const matchesStatus = statusFilter === "all" || s.placement_status === statusFilter;

      let matchesReadiness = true;
      if (readinessFilter === "high") matchesReadiness = s.readinessScore >= 80;
      if (readinessFilter === "moderate") matchesReadiness = s.readinessScore >= 60 && s.readinessScore < 80;
      if (readinessFilter === "low") matchesReadiness = s.readinessScore < 60;

      let matchesEligibility = true;
      if (eligibilityFilter === "eligible") matchesEligibility = s.isEligible;
      if (eligibilityFilter === "ineligible") matchesEligibility = !s.isEligible;
      if (eligibilityFilter === "high-cgpa") matchesEligibility = Number(s.cgpa) >= 8.0;
      if (eligibilityFilter === "backlogs") matchesEligibility = s.backlogs > 0;

      return matchesSearch && matchesBranch && matchesStatus && matchesReadiness && matchesEligibility;
    }).sort((a, b) => {
      if (sortBy === "cgpa-desc") return Number(b.cgpa) - Number(a.cgpa);
      if (sortBy === "readiness-desc") return b.readinessScore - a.readinessScore;
      if (sortBy === "name-asc") return a.full_name.localeCompare(b.full_name);
      if (sortBy === "roll-asc") return a.roll_no.localeCompare(b.roll_no);
      return 0;
    });
  }, [studentRows, search, branchFilter, statusFilter, readinessFilter, eligibilityFilter, sortBy]);

  const handleStatusChange = (studentId: string, newStatus: string) => {
    const updated = updateAdminStudentStatus(studentId, newStatus);
    setStudents(updated);
    if (selectedStudent?.id === studentId) {
      setSelectedStudent({ ...selectedStudent, placement_status: newStatus });
    }
    toast.success(`Placement status updated to "${newStatus}"`);
  };

  const handleExportCSV = () => {
    toast.success(`Exported ${filteredStudents.length} student records (CSV ready)`);
  };

  const selectedStudentComputed = useMemo(() => {
    if (!selectedStudent) return null;
    return studentRows.find((s) => s.id === selectedStudent.id) ?? null;
  }, [selectedStudent, studentRows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Placement Directory"
        subtitle="Manage student profiles, academic eligibility, readiness indices, and placement progression."
        action={
          <div className="flex items-center gap-2">
            <Link to="/admin/attention">
              <Button size="sm" variant="outline" className="gap-1.5 text-warning border-warning/40">
                <AlertTriangle className="h-4 w-4" /> At-Risk Cohort
              </Button>
            </Link>
            <Button size="sm" variant="secondary" onClick={handleExportCSV} className="gap-1.5">
              <Download className="h-4 w-4" /> Export Cohort
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-xs space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no, email..."
              className="pl-9 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="all">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EE">EE</option>
              <option value="ME">ME</option>
            </select>
          </div>

          {/* Placement Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="unplaced">Unplaced</option>
            </select>
          </div>

          {/* Readiness Score Filter */}
          <div>
            <select
              value={readinessFilter}
              onChange={(e) => setReadinessFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="all">All Readiness</option>
              <option value="high">High (80+)</option>
              <option value="moderate">Moderate (60-79)</option>
              <option value="low">Attention (&lt;60)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="cgpa-desc">Sort: CGPA (High to Low)</option>
              <option value="readiness-desc">Sort: Readiness (High to Low)</option>
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="roll-asc">Sort: Roll No (Asc)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" /> Quick Filter:
          </span>
          <button
            onClick={() => setEligibilityFilter("all")}
            className={`rounded-full px-2.5 py-0.5 transition-colors ${eligibilityFilter === "all" ? "bg-accent text-accent-foreground font-medium" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
          >
            All Candidates ({studentRows.length})
          </button>
          <button
            onClick={() => setEligibilityFilter("eligible")}
            className={`rounded-full px-2.5 py-0.5 transition-colors ${eligibilityFilter === "eligible" ? "bg-accent text-accent-foreground font-medium" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
          >
            Eligible ({studentRows.filter((s) => s.isEligible).length})
          </button>
          <button
            onClick={() => setEligibilityFilter("high-cgpa")}
            className={`rounded-full px-2.5 py-0.5 transition-colors ${eligibilityFilter === "high-cgpa" ? "bg-accent text-accent-foreground font-medium" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
          >
            CGPA â‰¥ 8.0 ({studentRows.filter((s) => Number(s.cgpa) >= 8.0).length})
          </button>
          <button
            onClick={() => setEligibilityFilter("backlogs")}
            className={`rounded-full px-2.5 py-0.5 transition-colors ${eligibilityFilter === "backlogs" ? "bg-accent text-accent-foreground font-medium" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
          >
            Active Backlogs ({studentRows.filter((s) => s.backlogs > 0).length})
          </button>

          {(search || branchFilter !== "all" || statusFilter !== "all" || readinessFilter !== "all" || eligibilityFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setBranchFilter("all");
                setStatusFilter("all");
                setReadinessFilter("all");
                setEligibilityFilter("all");
              }}
              className="text-xs text-destructive hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Empty>No students match the selected filter criteria.</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground uppercase text-[11px] tracking-wider border-b">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Roll No</th>
                  <th className="p-3.5">Branch</th>
                  <th className="p-3.5">CGPA</th>
                  <th className="p-3.5">Readiness</th>
                  <th className="p-3.5">Eligibility</th>
                  <th className="p-3.5">Placement Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-accent/15 text-accent font-semibold flex items-center justify-center shrink-0">
                          {s.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{s.full_name}</div>
                          <div className="text-[11px] text-muted-foreground">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground">{s.roll_no}</td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="font-medium text-[11px]">
                        {s.branch}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-sm">{s.cgpa}</div>
                      {s.backlogs > 0 && (
                        <div className="text-[10px] text-destructive font-medium">{s.backlogs} backlog</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`font-bold text-sm ${
                            s.readinessScore >= 80
                              ? "text-success"
                              : s.readinessScore >= 60
                              ? "text-accent"
                              : "text-destructive"
                          }`}
                        >
                          {s.readinessScore}%
                        </div>
                        <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              s.readinessScore >= 80
                                ? "bg-success"
                                : s.readinessScore >= 60
                                ? "bg-accent"
                                : "bg-destructive"
                            }`}
                            style={{ width: `${s.readinessScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {s.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" /> Blocked
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                          statusStyles[s.placement_status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.placement_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2"
                        onClick={() => setSelectedStudent(s)}
                      >
                        Profile <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground flex justify-between items-center border-t">
            <span>Showing {filteredStudents.length} of {students.length} students</span>
            <span>Batch {students[0]?.batch_year ?? 2025}</span>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    {selectedStudent.full_name}
                    <Badge variant="outline" className="text-xs">{selectedStudent.branch}</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1">
                    Roll No: {selectedStudent.roll_no} Â· {selectedStudent.email}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Placement Status:</span>
                  <select
                    value={selectedStudent.placement_status}
                    onChange={(e) => handleStatusChange(selectedStudent.id, e.target.value)}
                    className="h-8 rounded-md border bg-card px-2 text-xs font-semibold capitalize"
                  >
                    <option value="unplaced">Unplaced</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="placed">Placed</option>
                  </select>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-2 text-sm">
              {/* Academic Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg border bg-secondary/30 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">CGPA</div>
                  <div className="text-xl font-bold mt-0.5">{selectedStudent.cgpa}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Active Backlogs</div>
                  <div className={`text-xl font-bold mt-0.5 ${selectedStudent.backlogs > 0 ? "text-destructive" : "text-foreground"}`}>
                    {selectedStudent.backlogs}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Readiness Score</div>
                  <div className="text-xl font-bold text-accent mt-0.5">
                    {selectedStudentComputed?.readinessScore ?? 0}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Graduation Year</div>
                  <div className="text-xl font-bold mt-0.5">{selectedStudent.batch_year}</div>
                </div>
              </div>

              {/* Readiness Breakdown */}
              {selectedStudentComputed && (
                <div className="rounded-lg border p-4 bg-card space-y-3">
                  <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-accent" /> AI Readiness Score Composition
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {selectedStudentComputed.readinessParts.map((part) => (
                      <div key={part.label} className="rounded-md border p-2 bg-background/60">
                        <div className="text-muted-foreground">{part.label}</div>
                        <div className="font-bold text-sm mt-0.5">
                          {part.value} / {part.max}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Tagged Skills ({selectedStudent.student_skills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.student_skills.map((s) => {
                    const sk = getSkillById(s.skill_id);
                    return (
                      <Badge key={s.skill_id} variant="secondary" className="text-xs font-normal">
                        {sk.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Projects & Certifications */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-3.5 space-y-2">
                  <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-accent" /> Projects ({selectedStudent.projects.length})
                  </h4>
                  {selectedStudent.projects.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No projects listed.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedStudent.projects.map((p) => (
                        <div key={p.id} className="text-xs">
                          <div className="font-semibold">{p.title ?? "CapStone Project"}</div>
                          <div className="text-muted-foreground text-[11px]">{p.tech ?? "Technology Stack"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border p-3.5 space-y-2">
                  <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-success" /> Certifications ({selectedStudent.certifications.length})
                  </h4>
                  {selectedStudent.certifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No certifications listed.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedStudent.certifications.map((c) => (
                        <div key={c.id} className="text-xs">
                          <div className="font-semibold">{c.name ?? "Technical Certificate"}</div>
                          <div className="text-muted-foreground text-[11px]">{c.issuer ?? "Certified Provider"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Contact & Bio */}
              <div className="rounded-lg border p-3.5 bg-secondary/20 text-xs space-y-2">
                <div className="font-semibold text-foreground">Candidate Notes & Bio</div>
                <p className="text-muted-foreground">
                  {selectedStudent.bio ?? "Undergraduate student eligible for corporate recruitment drives."}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {selectedStudent.email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {selectedStudent.phone ?? "+91 98000 00000"}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}