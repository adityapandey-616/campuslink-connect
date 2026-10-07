import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader, Stat } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAdminKPISummary,
  getAdminDrives,
  getAdminInterviews,
  getAdminDocuments,
  getAdminOffers,
  getAdminStudents,
  getAdminCompanies,
  type AdminDriveDetail,
  type AdminInterviewItem,
} from "@/lib/admin-data";
import { getMockApplications, getMockNotifications } from "@/lib/mock-data";
import { statusStyles } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Placement Admin Dashboard — CAMPUSLINK" }] }),
  component: AdminDashboard,
});

export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Read latest reactive data from local store
  const kpi = getAdminKPISummary();
  const drives = getAdminDrives();
  const interviews = getAdminInterviews();
  const pendingDocs = getAdminDocuments().filter((d) => d.status === "pending");
  const offers = getAdminOffers();
  const students = getAdminStudents();
  const companies = getAdminCompanies();
  const apps = getMockApplications();
  const notifs = getMockNotifications();

  // Derived sections
  const upcomingDrives = drives
    .filter((d) => d.status === "scheduled" || d.status === "ongoing")
    .slice(0, 3);

  const upcomingInterviews = interviews
    .filter((i) => i.status === "scheduled")
    .slice(0, 4);

  const recentApplications = apps.slice(0, 5);
  const recentOffers = offers.slice(0, 4);

  const branchSummary = ["CSE", "IT", "ECE", "EE", "ME"].map((b) => {
    const total = students.filter((s) => s.branch === b).length;
    const placed = students.filter((s) => s.branch === b && s.placement_status === "placed").length;
    const rate = total > 0 ? Math.round((placed / total) * 100) : 0;
    return { branch: b, total, placed, rate };
  });

  const conflictsCount = interviews.filter((i) => i.has_conflict).length;

  return (
    <div className="space-y-8">
      {/* Page Header with Action Shortcuts */}
      <PageHeader
        title="Campus Placement Overview"
        subtitle="Real-time placement intelligence, drive schedules, student readiness, and verification queues."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/drives">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Schedule Drive
              </Button>
            </Link>
            <Link to="/admin/eligibility">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Sparkles className="h-4 w-4 text-accent" /> Run Eligibility Check
              </Button>
            </Link>
            <Link to="/admin/analytics">
              <Button size="sm" variant="secondary" className="gap-1.5">
                <TrendingUp className="h-4 w-4" /> Full Analytics
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Row 1 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <Stat
          label="Total Students"
          value={kpi.totalStudents}
          hint={`${kpi.eligibleStudents} placement eligible (${Math.round((kpi.eligibleStudents / Math.max(kpi.totalStudents, 1)) * 100)}%)`}
        />
        <Stat
          label="Students Placed"
          value={`${kpi.placedStudents} / ${kpi.totalStudents}`}
          hint={`${kpi.placementRate}% placement rate`}
        />
        <Stat
          label="Partner Companies"
          value={kpi.activeCompanies}
          hint={`${companies.length} registered total`}
        />
        <Stat
          label="Active Drives"
          value={kpi.activeDrives}
          hint={`${drives.length} total scheduled/held`}
        />
      </section>

      {/* KPI Cards Row 2 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <Stat
          label="Total Applications"
          value={kpi.totalApplications}
          hint="Across all current openings"
        />
        <Stat
          label="Pending Documents"
          value={kpi.pendingDocuments}
          hint={kpi.pendingDocuments > 0 ? "Requires admin review" : "All clear"}
        />
        <Stat
          label="Upcoming Interviews"
          value={kpi.upcomingInterviews}
          hint={conflictsCount > 0 ? `⚠️ ${conflictsCount} conflict detected` : "No schedule clash"}
        />
        <Stat
          label="Offers Released"
          value={kpi.offersReleased}
          hint={`Avg ₹${kpi.averageCTC} LPA · Max ₹${kpi.highestCTC} LPA`}
        />
      </section>

      {/* Conflicts / Alerts Banner if any */}
      {conflictsCount > 0 && (
        <div className="flex items-start justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <div className="font-semibold text-sm">
                Interview Schedule Conflict Detected ({conflictsCount} interview{conflictsCount > 1 ? "s" : ""})
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                Students have overlapping interview slots or venue collisions. Review schedule to avoid candidate clashes.
              </p>
            </div>
          </div>
          <Link to="/admin/interviews">
            <Button size="sm" variant="outline" className="border-amber-500/40 text-xs bg-amber-500/10 hover:bg-amber-500/20">
              Resolve Conflicts <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Drives, Interviews, Applications */}
        <div className="space-y-6 lg:col-span-8">
          {/* Upcoming Placement Drives */}
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-accent" />
                <h2 className="font-semibold text-base">Upcoming Placement Drives</h2>
              </div>
              <Link to="/admin/drives" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
                View all drives <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {upcomingDrives.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active upcoming drives scheduled.</p>
            ) : (
              <div className="divide-y rounded-lg border bg-background/50">
                {upcomingDrives.map((drive) => (
                  <div key={drive.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">{drive.title}</span>
                        <Badge variant="outline" className="capitalize text-[10px] py-0 px-1.5">
                          {drive.mode}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{drive.company?.name}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {drive.drive_date} at {drive.drive_time}</span>
                        <span>·</span>
                        <span>{drive.venue}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Cutoff: <span className="font-semibold text-foreground">{drive.min_cgpa} CGPA</span>
                      </span>
                      <Link to="/admin/drives">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2">Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Interviews with Conflict Status */}
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-accent" />
                <h2 className="font-semibold text-base">Upcoming Candidate Interviews</h2>
              </div>
              <Link to="/admin/interviews" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
                Manage all ({interviews.length}) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {upcomingInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming interviews scheduled today.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingInterviews.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 transition-colors ${
                      item.has_conflict ? "border-amber-500/40 bg-amber-500/5" : "bg-background/60 hover:bg-muted/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{item.student_name}</span>
                        <Badge variant="secondary" className="text-[10px]">{item.student_branch}</Badge>
                        {item.has_conflict && (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> Conflict
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{item.company_name}</span> · {item.round} · {new Date(item.scheduled_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </div>
                      {item.has_conflict && item.conflict_reason && (
                        <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                          {item.conflict_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.mode}</span>
                      <Link to="/admin/interviews">
                        <Button size="sm" variant={item.has_conflict ? "destructive" : "outline"} className="h-7 text-xs px-2">
                          {item.has_conflict ? "Resolve" : "View"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications & Pipeline Flow */}
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <h2 className="font-semibold text-base">Recent Student Applications</h2>
              </div>
              <Link to="/admin/applications" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
                View all applications <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2.5 font-medium">Student</th>
                    <th className="pb-2.5 font-medium">Company & Role</th>
                    <th className="pb-2.5 font-medium">Match</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/30">
                      <td className="py-2.5 font-medium text-foreground">
                        {app.student?.full_name ?? "Student"}
                        <span className="ml-1 text-[10px] text-muted-foreground">({app.student?.branch})</span>
                      </td>
                      <td className="py-2.5">
                        <div className="font-medium text-foreground/90">{app.job?.company.name}</div>
                        <div className="text-[11px] text-muted-foreground">{app.job?.title}</div>
                      </td>
                      <td className="py-2.5">
                        <span className="font-semibold text-accent">{app.match_score}%</span>
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyles[app.status] ?? "bg-muted text-muted-foreground"}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Link to="/admin/applications">
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2">Inspect</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Pending Actions, Progress by Branch, Offers */}
        <div className="space-y-6 lg:col-span-4">
          {/* Action Queue: Pending Verifications */}
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-sm">Action Queue</h3>
              </div>
              <Badge variant="secondary" className="text-xs">{pendingDocs.length} Pending</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Student submissions awaiting placement officer review and signature verification.
            </p>

            {pendingDocs.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-success" />
                All student documents are verified.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingDocs.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="rounded-lg border bg-background/50 p-3 text-xs">
                    <div className="font-medium text-foreground">{doc.student_name} ({doc.student_branch})</div>
                    <div className="text-muted-foreground mt-0.5 truncate">{doc.doc_type}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(doc.submitted_at).toLocaleDateString()}
                      </span>
                      <Link to="/admin/documents">
                        <Button size="sm" variant="outline" className="h-6 text-[11px] px-2">
                          Verify Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {pendingDocs.length > 3 && (
                  <Link to="/admin/documents" className="block text-center text-xs text-accent hover:underline pt-1">
                    +{pendingDocs.length - 3} more pending documents
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Branch-wise Placement Summary */}
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-sm">Branch Placement Rates</h3>
              </div>
              <Link to="/admin/analytics" className="text-xs text-muted-foreground hover:text-foreground">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {branchSummary.map((b) => (
                <div key={b.branch} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{b.branch}</span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{b.placed}</strong> / {b.total} ({b.rate}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-accent transition-all duration-500 rounded-full"
                      style={{ width: `${b.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Offers Released */}
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-success" />
                <h3 className="font-semibold text-sm">Recent Offers Released</h3>
              </div>
              <Link to="/admin/documents" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentOffers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between rounded-lg border bg-background/50 p-3 text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{offer.student_name}</div>
                    <div className="text-muted-foreground text-[11px]">{offer.company_name} · {offer.job_title}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-success text-sm">₹{offer.ctc_lpa} LPA</div>
                    <Badge variant="outline" className="text-[10px] capitalize py-0 px-1 mt-0.5">
                      {offer.offer_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts Box */}
          <div className="rounded-xl border bg-sidebar/5 p-4 text-xs space-y-2">
            <div className="font-medium text-foreground mb-1">Placement Cell Quick Links</div>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/admin/students" className="rounded-md border bg-card p-2 text-center hover:bg-accent/10 transition-colors">
                <Users className="mx-auto h-4 w-4 text-foreground/70 mb-1" />
                <span>Student Directory</span>
              </Link>
              <Link to="/admin/companies" className="rounded-md border bg-card p-2 text-center hover:bg-accent/10 transition-colors">
                <Building2 className="mx-auto h-4 w-4 text-foreground/70 mb-1" />
                <span>Company List</span>
              </Link>
              <Link to="/admin/attention" className="rounded-md border bg-card p-2 text-center hover:bg-accent/10 transition-colors">
                <AlertTriangle className="mx-auto h-4 w-4 text-warning mb-1" />
                <span>Needs Attention</span>
              </Link>
              <Link to="/admin/settings" className="rounded-md border bg-card p-2 text-center hover:bg-accent/10 transition-colors">
                <Sparkles className="mx-auto h-4 w-4 text-accent mb-1" />
                <span>Cell Policies</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
