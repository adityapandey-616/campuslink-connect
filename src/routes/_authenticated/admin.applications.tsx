import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Filter,
  GraduationCap,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Empty, PageHeader } from "@/components/AppShell";
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
  getMockApplications,
  updateMockApplicationStatus,
  getMockJobs,
  type MockApplication,
} from "@/lib/mock-data";
import { getAdminCompanies, getAdminStudents } from "@/lib/admin-data";
import { statusStyles } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  head: () => ({ meta: [{ title: "Application Management — CAMPUSLINK Admin" }] }),
  component: AdminApplicationsPage,
});

export function AdminApplicationsPage() {
  const [apps, setApps] = useState<MockApplication[]>(() => getMockApplications());
  const [companies] = useState(() => getAdminCompanies());
  const [jobs] = useState(() => getMockJobs());
  const [students] = useState(() => getAdminStudents());

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<MockApplication | null>(null);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const q = search.toLowerCase().trim();
      const studentName = app.student?.full_name?.toLowerCase() ?? "";
      const companyName = app.job?.company.name.toLowerCase() ?? "";
      const jobTitle = app.job?.title.toLowerCase() ?? "";
      const rollNo = app.student?.id?.toLowerCase() ?? "";

      const matchesSearch =
        !q ||
        studentName.includes(q) ||
        companyName.includes(q) ||
        jobTitle.includes(q) ||
        rollNo.includes(q);

      const matchesCompany = companyFilter === "all" || app.job?.company_id === companyFilter;
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesCompany && matchesStatus;
    });
  }, [apps, search, companyFilter, statusFilter]);

  const handleStatusChange = (appId: string, status: string) => {
    updateMockApplicationStatus(appId, status);
    const updated = getMockApplications();
    setApps(updated);
    if (selectedApp?.id === appId) {
      const next = updated.find((a) => a.id === appId) ?? null;
      setSelectedApp(next);
    }
    toast.success(`Application updated to "${status}"`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Lifecycle Management"
        subtitle="Track student application progression from initial review to shortlisting, interviews, and final offers."
      />

      {/* Filter and Search Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, company, role..."
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

          <div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="all">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="all">All Application Stages</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview Round</option>
              <option value="offered">Offered</option>
              <option value="joined">Joined</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" /> Quick Filter:
          </span>
          {["applied", "shortlisted", "interview", "offered", "joined"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(statusFilter === st ? "all" : st)}
              className={`rounded-full px-2.5 py-0.5 capitalize transition-colors ${
                statusFilter === st
                  ? "bg-accent text-accent-foreground font-medium"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {st} ({apps.filter((a) => a.status === st).length})
            </button>
          ))}
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="text-xs text-destructive hover:underline ml-auto"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Applications Table */}
      {filteredApps.length === 0 ? (
        <Empty>No applications match the search or filter criteria.</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground uppercase text-[11px] tracking-wider border-b">
                <tr>
                  <th className="p-3.5">Candidate</th>
                  <th className="p-3.5">Company & Role</th>
                  <th className="p-3.5">Applied Date</th>
                  <th className="p-3.5">AI Match</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Interviews / Offers</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-medium text-foreground">
                      <div className="font-semibold text-sm">{app.student?.full_name ?? "Candidate"}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {app.student?.branch} · CGPA {app.student?.cgpa ?? 8.0}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-foreground/90">{app.job?.company.name}</div>
                      <div className="text-[11px] text-muted-foreground">{app.job?.title}</div>
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="font-bold text-accent">
                        {app.match_score}%
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                          statusStyles[app.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {app.offers.length > 0 ? (
                        <span className="text-success font-semibold flex items-center gap-1">
                          <Award className="h-3.5 w-3.5" /> Offered (₹{app.offers[0]?.ctc_lpa} LPA)
                        </span>
                      ) : app.interviews.length > 0 ? (
                        <span className="text-accent flex items-center gap-1">
                          <CalendarCheck className="h-3.5 w-3.5" /> {app.interviews.length} round(s)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2"
                        onClick={() => setSelectedApp(app)}
                      >
                        Inspect <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground flex justify-between items-center border-t">
            <span>Showing {filteredApps.length} of {apps.length} applications</span>
          </div>
        </div>
      )}

      {/* Inspect Application Modal */}
      {selectedApp && (
        <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                <div>
                  <DialogTitle className="text-lg">
                    {selectedApp.student?.full_name}&apos;s Application
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1">
                    Applying for {selectedApp.job?.title} at {selectedApp.job?.company.name}
                  </DialogDescription>
                </div>
                <Badge
                  className={`capitalize text-xs ${
                    statusStyles[selectedApp.status] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {selectedApp.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-secondary/30">
                <div>
                  <div className="text-muted-foreground">Applicant Match Score</div>
                  <div className="text-lg font-bold text-accent mt-0.5">{selectedApp.match_score}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Applied On</div>
                  <div className="text-sm font-semibold mt-0.5">
                    {new Date(selectedApp.created_at).toLocaleString([], { dateStyle: "medium" })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Candidate Branch & CGPA</div>
                  <div className="text-sm font-semibold mt-0.5">
                    {selectedApp.student?.branch} · {selectedApp.student?.cgpa} CGPA
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Role CTC Compensation</div>
                  <div className="text-sm font-semibold mt-0.5">₹{selectedApp.job?.ctc_lpa} LPA</div>
                </div>
              </div>

              {/* Status Progression Controls */}
              <div className="p-3.5 rounded-lg border space-y-2">
                <div className="font-semibold text-foreground">Advance Stage (Demo Action)</div>
                <div className="flex flex-wrap gap-2">
                  {["shortlisted", "interview", "offered", "joined", "rejected"].map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={selectedApp.status === st ? "default" : "outline"}
                      className="capitalize h-7 text-xs px-2.5"
                      onClick={() => handleStatusChange(selectedApp.id, st)}
                    >
                      Mark as {st}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Interview Rounds If Any */}
              {selectedApp.interviews.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-semibold text-foreground">Scheduled Rounds</div>
                  {selectedApp.interviews.map((int) => (
                    <div key={int.id} className="rounded-md border p-2.5 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-foreground">{int.round}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(int.scheduled_at).toLocaleString()}</div>
                      </div>
                      <Badge variant="outline" className="capitalize text-[10px]">{int.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
