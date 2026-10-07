import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Filter,
  Eye,
  Building2,
  Sparkles,
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
  getAdminDrives,
  addAdminDrive,
  updateAdminDrive,
  deleteAdminDrive,
  getAdminCompanies,
  getAdminStudents,
  type AdminDriveDetail,
} from "@/lib/admin-data";
import { getMockJobs } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/drives")({
  head: () => ({ meta: [{ title: "Placement Drives — CAMPUSLINK Admin" }] }),
  component: AdminDrivesPage,
});

export function AdminDrivesPage() {
  const [drives, setDrives] = useState<AdminDriveDetail[]>(() => getAdminDrives());
  const [companies] = useState(() => getAdminCompanies());
  const [jobs] = useState(() => getMockJobs());
  const [students] = useState(() => getAdminStudents());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState<AdminDriveDetail | null>(null);
  const [viewingDrive, setViewingDrive] = useState<AdminDriveDetail | null>(null);

  // Compute eligible candidates count dynamically for each drive
  const driveStats = useMemo(() => {
    return drives.map((d) => {
      const eligibleCount = students.filter((s) => {
        const meetsCgpa = Number(s.cgpa) >= d.min_cgpa;
        const meetsBacklogs = s.backlogs <= d.max_backlogs;
        const meetsBranch = d.eligible_branches.includes(s.branch);
        return meetsCgpa && meetsBacklogs && meetsBranch;
      }).length;

      return {
        ...d,
        calculatedEligible: eligibleCount,
      };
    });
  }, [drives, students]);

  const filteredDrives = useMemo(() => {
    return driveStats.filter((d) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.company?.name.toLowerCase().includes(q) ||
        d.venue.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [driveStats, search, statusFilter]);

  const handleCreateDrive = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const company_id = String(fd.get("company_id") || "c1");
    const company = companies.find((c) => c.id === company_id) || companies[0];
    const title = String(fd.get("title") || "").trim();
    const drive_date = String(fd.get("drive_date") || "").trim();
    const drive_time = String(fd.get("drive_time") || "09:30 AM").trim();
    const venue = String(fd.get("venue") || "Main Campus Auditorium").trim();
    const mode = (String(fd.get("mode") || "In-Person")) as AdminDriveDetail["mode"];
    const min_cgpa = Number(fd.get("min_cgpa") || 7.0);
    const max_backlogs = Number(fd.get("max_backlogs") || 0);
    const deadline = String(fd.get("deadline") || drive_date).trim();
    const description = String(fd.get("description") || "Campus recruitment drive").trim();

    const branchesChecked: string[] = [];
    ["CSE", "IT", "ECE", "EE", "ME"].forEach((b) => {
      if (fd.get(`branch_${b}`)) branchesChecked.push(b);
    });

    if (!title || !drive_date) {
      toast.error("Please fill in drive title and scheduled date.");
      return;
    }

    const newDrive = addAdminDrive({
      company_id,
      title,
      drive_date,
      drive_time,
      venue,
      mode,
      status: "scheduled",
      company: { name: company?.name ?? "Partner Company" },
      min_cgpa,
      max_backlogs,
      eligible_branches: branchesChecked.length ? branchesChecked : ["CSE", "IT"],
      deadline,
      description,
      registered_count: 0,
      shortlisted_count: 0,
    });

    setDrives(getAdminDrives());
    setIsCreateOpen(false);
    toast.success(`Drive "${newDrive.title}" scheduled successfully!`);
  };

  const handleUpdateStatus = (driveId: string, status: string) => {
    const updated = updateAdminDrive(driveId, { status });
    setDrives(updated);
    if (viewingDrive?.id === driveId) {
      setViewingDrive({ ...viewingDrive, status });
    }
    toast.success(`Drive status updated to ${status}`);
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDrive) return;
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "").trim();
    const drive_date = String(fd.get("drive_date") || "").trim();
    const drive_time = String(fd.get("drive_time") || "").trim();
    const venue = String(fd.get("venue") || "").trim();
    const mode = (String(fd.get("mode") || "In-Person")) as AdminDriveDetail["mode"];
    const min_cgpa = Number(fd.get("min_cgpa") || editingDrive.min_cgpa);
    const max_backlogs = Number(fd.get("max_backlogs") || editingDrive.max_backlogs);
    const description = String(fd.get("description") || "").trim();

    const updated = updateAdminDrive(editingDrive.id, {
      title,
      drive_date,
      drive_time,
      venue,
      mode,
      min_cgpa,
      max_backlogs,
      description,
    });
    setDrives(updated);
    setEditingDrive(null);
    toast.success("Drive details updated successfully.");
  };

  const handleDelete = (driveId: string) => {
    const updated = deleteAdminDrive(driveId);
    setDrives(updated);
    if (viewingDrive?.id === driveId) setViewingDrive(null);
    toast.success("Drive removed from schedule.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Placement Drives"
        subtitle="Schedule and orchestrate on-campus and virtual recruitment drives, eligibility criteria, and logistics."
        action={
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Schedule New Drive
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by drive title, company, or venue..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="all">All Drive Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-muted-foreground">
            Total Drives: <strong className="text-foreground ml-1">{drives.length}</strong>
          </div>
        </div>
      </div>

      {/* Drives Grid */}
      {filteredDrives.length === 0 ? (
        <Empty>No placement drives match the criteria.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDrives.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border bg-card p-5 shadow-xs hover:border-accent/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-foreground">{d.title}</span>
                    </div>
                    <div className="text-xs font-medium text-accent mt-0.5">{d.company?.name}</div>
                  </div>
                  <Badge
                    variant={
                      d.status === "scheduled"
                        ? "default"
                        : d.status === "ongoing"
                        ? "secondary"
                        : d.status === "completed"
                        ? "outline"
                        : "destructive"
                    }
                    className="capitalize text-[11px] py-0.5 px-2"
                  >
                    {d.status}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 my-2.5">
                  {d.description}
                </p>

                {/* Logistics Info */}
                <div className="grid grid-cols-2 gap-2 rounded-lg border bg-secondary/30 p-2.5 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <CalendarDays className="h-3.5 w-3.5 text-foreground/70 shrink-0" />
                    <span>{d.drive_date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="h-3.5 w-3.5 text-foreground/70 shrink-0" />
                    <span>{d.drive_time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-foreground/70 shrink-0" />
                    <span className="truncate">{d.venue} ({d.mode})</span>
                  </div>
                </div>

                {/* Eligibility Tags */}
                <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
                  <span className="text-muted-foreground">Cutoff:</span>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    ≥ {d.min_cgpa} CGPA
                  </Badge>
                  <span className="text-muted-foreground">Branches:</span>
                  <div className="flex gap-1">
                    {d.eligible_branches.map((b) => (
                      <Badge key={b} variant="secondary" className="text-[10px] py-0 px-1">
                        {b}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Stats & Actions */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    <span>Eligible Cohort: <strong className="text-foreground">{d.calculatedEligible} students</strong></span>
                  </div>
                  <div className="text-muted-foreground">
                    Reg: <strong className="text-foreground">{d.registered_count ?? 0}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <select
                    value={d.status}
                    onChange={(e) => handleUpdateStatus(d.id, e.target.value)}
                    className="h-8 rounded-md border bg-card px-2 text-xs font-medium capitalize"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => setViewingDrive(d)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => setEditingDrive(d)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Drive Dialog */}
      {viewingDrive && (
        <Dialog open={!!viewingDrive} onOpenChange={(open) => !open && setViewingDrive(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center justify-between pr-4">
                <span>{viewingDrive.title}</span>
                <Badge variant="outline" className="capitalize text-xs">{viewingDrive.status}</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Hosted by {viewingDrive.company?.name} · {viewingDrive.mode} Mode
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs pt-1">
              <div className="p-3 rounded-lg border bg-secondary/30 space-y-1.5">
                <div className="font-semibold text-foreground">Drive Logistics</div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Date: <strong className="text-foreground">{viewingDrive.drive_date}</strong></div>
                  <div>Time: <strong className="text-foreground">{viewingDrive.drive_time}</strong></div>
                  <div>Venue: <strong className="text-foreground">{viewingDrive.venue}</strong></div>
                  <div>Mode: <strong className="text-foreground">{viewingDrive.mode}</strong></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border space-y-1.5">
                <div className="font-semibold text-foreground">Eligibility Cutoffs</div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Minimum CGPA: <strong className="text-foreground">{viewingDrive.min_cgpa}</strong></div>
                  <div>Max Backlogs Allowed: <strong className="text-foreground">{viewingDrive.max_backlogs}</strong></div>
                  <div className="col-span-2">
                    Allowed Branches:{" "}
                    <strong className="text-foreground">{viewingDrive.eligible_branches.join(", ")}</strong>
                  </div>
                  <div>Application Deadline: <strong className="text-foreground">{viewingDrive.deadline}</strong></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-accent/5">
                <div className="font-semibold text-foreground mb-1">Drive Description & Instructions</div>
                <p className="text-muted-foreground leading-relaxed">{viewingDrive.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30"
                  onClick={() => handleDelete(viewingDrive.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Drive
                </Button>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewingDrive(null)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const next = viewingDrive.status === "scheduled" ? "ongoing" : "completed";
                      handleUpdateStatus(viewingDrive.id, next);
                    }}
                  >
                    Advance Status
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Drive Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Placement Drive</DialogTitle>
            <DialogDescription className="text-xs">
              Publish a campus recruitment drive with eligibility criteria and venue logistics.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDrive} className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-medium text-foreground">Company Partner *</label>
              <select name="company_id" className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground mt-1">
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-foreground">Drive Title *</label>
              <Input name="title" placeholder="e.g. Novatek Systems On-Campus Hiring 2026" required className="h-9 mt-1 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Drive Date *</label>
                <Input name="drive_date" type="date" required className="h-9 mt-1 text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground">Time *</label>
                <Input name="drive_time" defaultValue="09:30 AM" className="h-9 mt-1 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Venue *</label>
                <Input name="venue" defaultValue="Main Auditorium & Labs" className="h-9 mt-1 text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground">Mode</label>
                <select name="mode" className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground mt-1">
                  <option value="In-Person">In-Person</option>
                  <option value="Virtual">Virtual</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div>
                <label className="font-medium text-foreground">Min CGPA</label>
                <Input name="min_cgpa" type="number" step="0.1" defaultValue="7.0" className="h-9 mt-1 text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground">Max Backlogs</label>
                <Input name="max_backlogs" type="number" defaultValue="0" className="h-9 mt-1 text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground">Apply Deadline</label>
                <Input name="deadline" type="date" className="h-9 mt-1 text-xs" />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Eligible Branches</label>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {["CSE", "IT", "ECE", "EE", "ME"].map((b) => (
                  <label key={b} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" name={`branch_${b}`} defaultChecked={b === "CSE" || b === "IT"} className="rounded" />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Drive Brief & Schedule</label>
              <Input name="description" placeholder="Aptitude test, technical rounds, HR interview sequence..." className="h-9 mt-1 text-xs" />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Publish Drive
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Drive Dialog */}
      {editingDrive && (
        <Dialog open={!!editingDrive} onOpenChange={(open) => !open && setEditingDrive(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Placement Drive</DialogTitle>
              <DialogDescription className="text-xs">
                Update date, venue logistics, or eligibility requirements.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs pt-1">
              <div>
                <label className="font-medium text-foreground">Drive Title</label>
                <Input name="title" defaultValue={editingDrive.title} required className="h-9 mt-1 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground">Drive Date</label>
                  <Input name="drive_date" type="date" defaultValue={editingDrive.drive_date} required className="h-9 mt-1 text-xs" />
                </div>
                <div>
                  <label className="font-medium text-foreground">Time</label>
                  <Input name="drive_time" defaultValue={editingDrive.drive_time} className="h-9 mt-1 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground">Venue</label>
                  <Input name="venue" defaultValue={editingDrive.venue} className="h-9 mt-1 text-xs" />
                </div>
                <div>
                  <label className="font-medium text-foreground">Mode</label>
                  <select name="mode" defaultValue={editingDrive.mode} className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground mt-1">
                    <option value="In-Person">In-Person</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground">Min CGPA</label>
                  <Input name="min_cgpa" type="number" step="0.1" defaultValue={editingDrive.min_cgpa} className="h-9 mt-1 text-xs" />
                </div>
                <div>
                  <label className="font-medium text-foreground">Max Backlogs</label>
                  <Input name="max_backlogs" type="number" defaultValue={editingDrive.max_backlogs} className="h-9 mt-1 text-xs" />
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground">Description</label>
                <Input name="description" defaultValue={editingDrive.description} className="h-9 mt-1 text-xs" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingDrive(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
