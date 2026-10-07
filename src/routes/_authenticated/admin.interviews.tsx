import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Plus,
  Search,
  UserCheck,
  Video,
  XCircle,
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
  getAdminInterviews,
  addAdminInterview,
  updateAdminInterviewStatus,
  rescheduleAdminInterview,
  getAdminStudents,
  getAdminCompanies,
  type AdminInterviewItem,
} from "@/lib/admin-data";
import { getMockJobs } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/interviews")({
  head: () => ({ meta: [{ title: "Interview Scheduling — CAMPUSLINK Admin" }] }),
  component: AdminInterviewsPage,
});

export function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<AdminInterviewItem[]>(() => getAdminInterviews());
  const [students] = useState(() => getAdminStudents());
  const [companies] = useState(() => getAdminCompanies());
  const [jobs] = useState(() => getMockJobs());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [reschedulingItem, setReschedulingItem] = useState<AdminInterviewItem | null>(null);

  const conflictsCount = useMemo(() => {
    return interviews.filter((i) => i.has_conflict).length;
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.student_name.toLowerCase().includes(q) ||
        item.company_name.toLowerCase().includes(q) ||
        item.job_title.toLowerCase().includes(q) ||
        item.round.toLowerCase().includes(q) ||
        item.student_roll.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesConflict = !showConflictsOnly || item.has_conflict;

      return matchesSearch && matchesStatus && matchesConflict;
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [interviews, search, statusFilter, showConflictsOnly]);

  const handleCreateInterview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const student_id = String(fd.get("student_id") || "s1");
    const company_id = String(fd.get("company_id") || "c1");
    const job_id = String(fd.get("job_id") || "j1");
    const round = String(fd.get("round") || "Technical Round 1").trim();
    const date = String(fd.get("date") || "").trim();
    const time = String(fd.get("time") || "10:00").trim();
    const mode = String(fd.get("mode") || "Online").trim();
    const location = String(fd.get("location") || "Google Meet").trim();

    if (!date || !time) {
      toast.error("Please pick a date and time for the interview.");
      return;
    }

    const st = students.find((s) => s.id === student_id) ?? students[0]!;
    const comp = companies.find((c) => c.id === company_id) ?? companies[0]!;
    const jb = jobs.find((j) => j.id === job_id) ?? jobs[0]!;

    const scheduled_at = `${date}T${time}:00`;

    const created = addAdminInterview({
      application_id: `app-dyn-${Date.now()}`,
      student_id,
      student_name: st.full_name,
      student_branch: st.branch,
      student_roll: st.roll_no,
      student_cgpa: Number(st.cgpa),
      company_id,
      company_name: comp.name,
      job_id,
      job_title: jb.title,
      round,
      scheduled_at,
      mode,
      location,
      status: "scheduled",
    });

    const refreshed = getAdminInterviews();
    setInterviews(refreshed);
    setIsScheduleOpen(false);

    if (refreshed.find((i) => i.id === created.id)?.has_conflict) {
      toast.warning("Interview scheduled, but a schedule conflict was detected! Check badge.");
    } else {
      toast.success(`Interview scheduled for ${st.full_name} with ${comp.name}!`);
    }
  };

  const handleReschedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reschedulingItem) return;
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date") || "").trim();
    const time = String(fd.get("time") || "10:00").trim();
    const location = String(fd.get("location") || reschedulingItem.location).trim();

    const newDateTime = `${date}T${time}:00`;
    const updated = rescheduleAdminInterview(reschedulingItem.id, newDateTime, location);
    setInterviews(updated);
    setReschedulingItem(null);
    toast.success("Interview slot updated. Schedule conflict check completed.");
  };

  const handleStatusChange = (id: string, status: AdminInterviewItem["status"]) => {
    const updated = updateAdminInterviewStatus(id, status);
    setInterviews(updated);
    toast.success(`Interview marked as ${status}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews & Slot Scheduling"
        subtitle="Manage technical rounds, HR evaluations, online meet links, and automated candidate clash detection."
        action={
          <Button size="sm" onClick={() => setIsScheduleOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Schedule Interview Slot
          </Button>
        }
      />

      {/* Conflict Alert Banner */}
      {conflictsCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm">
                Schedule Conflict Alert: {conflictsCount} Slot{conflictsCount > 1 ? "s" : ""} Overlapping
              </span>
              <p className="text-muted-foreground mt-0.5">
                Overlapping interview timings or venue double-bookings detected. Reschedule slots below to prevent student clashes.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConflictsOnly(!showConflictsOnly)}
            className="rounded-md border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted text-foreground transition-colors shrink-0"
          >
            {showConflictsOnly ? "Show All Slots" : "Filter Conflicted Slots"}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, company, roll no, or round..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="all">All Round Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cleared">Cleared</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-muted-foreground">
            Total Slots: <strong className="text-foreground ml-1">{interviews.length}</strong>
          </div>
        </div>
      </div>

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <Empty>No interviews found for the specified filters.</Empty>
      ) : (
        <div className="space-y-3">
          {filteredInterviews.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4.5 transition-all ${
                item.has_conflict
                  ? "border-amber-500/50 bg-amber-500/5 shadow-xs"
                  : "border-border bg-card hover:border-accent/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{item.student_name}</span>
                    <span className="font-mono text-xs text-muted-foreground">({item.student_roll})</span>
                    <Badge variant="outline" className="text-[10px]">{item.student_branch}</Badge>
                    <Badge
                      variant={
                        item.status === "scheduled"
                          ? "default"
                          : item.status === "cleared"
                          ? "default"
                          : "outline"
                      }
                      className="capitalize text-[10px] py-0 px-1.5"
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <strong className="text-foreground font-medium">{item.company_name}</strong> · {item.job_title} · <span className="text-accent font-medium">{item.round}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-foreground/70" />
                      {new Date(item.scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      {item.mode === "Online" ? <Video className="h-3.5 w-3.5 text-accent" /> : <MapPin className="h-3.5 w-3.5" />}
                      {item.location} ({item.mode})
                    </span>
                  </div>
                </div>

                {/* Actions & Reschedule */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                    className="h-8 rounded-md border bg-card px-2 text-xs capitalize"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cleared">Cleared</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => setReschedulingItem(item)}
                  >
                    Reschedule
                  </Button>
                </div>
              </div>

              {/* Conflict Notification Box */}
              {item.has_conflict && item.conflict_reason && (
                <div className="mt-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-medium">{item.conflict_reason}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs px-2.5 shrink-0"
                    onClick={() => setReschedulingItem(item)}
                  >
                    Resolve Conflict
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Schedule New Interview Modal */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview Round</DialogTitle>
            <DialogDescription className="text-xs">
              Book an interview slot. Antigravity conflict engine automatically verifies candidate availability.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInterview} className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-medium text-foreground">Candidate *</label>
              <select name="student_id" className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground mt-1">
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.roll_no} - {s.branch})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-foreground">Company Partner *</label>
              <select name="company_id" className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground mt-1">
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-foreground">Job Role *</label>
              <select name="job_id" className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground mt-1">
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-foreground">Round Title *</label>
              <Input name="round" defaultValue="Technical Round 1: Algorithms & Coding" required className="h-9 mt-1 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Date *</label>
                <Input name="date" type="date" required className="h-9 mt-1 text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground">Time *</label>
                <Input name="time" type="time" defaultValue="10:00" required className="h-9 mt-1 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Mode</label>
                <select name="mode" className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground mt-1">
                  <option value="Online">Online</option>
                  <option value="In-Person">In-Person</option>
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground">Location / Link</label>
                <Input name="location" defaultValue="Google Meet" className="h-9 mt-1 text-xs" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsScheduleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Confirm Slot
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      {reschedulingItem && (
        <Dialog open={!!reschedulingItem} onOpenChange={(open) => !open && setReschedulingItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reschedule Interview Slot</DialogTitle>
              <DialogDescription className="text-xs">
                Move {reschedulingItem.student_name}&apos;s interview with {reschedulingItem.company_name} to a conflict-free time.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReschedule} className="space-y-3 text-xs pt-1">
              <div className="rounded-md border bg-secondary/30 p-2.5">
                <div className="font-semibold text-foreground">{reschedulingItem.round}</div>
                <div className="text-muted-foreground text-[11px]">
                  Current: {new Date(reschedulingItem.scheduled_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground">New Date *</label>
                  <Input
                    name="date"
                    type="date"
                    defaultValue={reschedulingItem.scheduled_at.slice(0, 10)}
                    required
                    className="h-9 mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground">New Time *</label>
                  <Input
                    name="time"
                    type="time"
                    defaultValue="14:00"
                    required
                    className="h-9 mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground">Location / Link</label>
                <Input
                  name="location"
                  defaultValue={reschedulingItem.location}
                  className="h-9 mt-1 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setReschedulingItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Slot
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
