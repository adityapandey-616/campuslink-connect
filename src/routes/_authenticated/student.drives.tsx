import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Calendar, CheckCircle2, Clock, GraduationCap, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { getMockDrives, addMockNotification } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/student/drives")({
  component: PlacementDrives,
});

function PlacementDrives() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed">("all");
  const [registered, setRegistered] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("campuslink_drive_registrations");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const drives = useQuery({
    queryKey: ["mock-drives"],
    queryFn: getMockDrives,
  });

  function handleRegister(driveId: string, driveName: string, companyName: string) {
    const newSet = new Set(registered);
    newSet.add(driveId);
    setRegistered(newSet);
    localStorage.setItem("campuslink_drive_registrations", JSON.stringify([...newSet]));
    addMockNotification({
      title: `Registered — ${companyName}`,
      body: `You have registered for ${driveName}. Check the drive details for venue and timings.`,
      category: "drive",
    });
    qc.invalidateQueries({ queryKey: ["mock-notifications"] });
    toast.success(`Registered for ${driveName}!`);
  }

  if (drives.isLoading) return <Loading />;

  const allDrives = drives.data ?? [];
  const list = allDrives.filter((d) => filter === "all" || d.status === filter);

  const upcoming = allDrives.filter((d) => d.status === "scheduled");
  const completed = allDrives.filter((d) => d.status === "completed");

  return (
    <>
      <PageHeader
        title="Placement Drives"
        subtitle="Campus drives scheduled for your batch. Register early to confirm your slot."
      />

      {/* Summary row */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="font-display text-2xl font-bold text-accent">{upcoming.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Upcoming drives</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="font-display text-2xl font-bold">{registered.size}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Registered</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="font-display text-2xl font-bold text-muted-foreground">{completed.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Completed</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border bg-card p-1 w-fit">
        {(["all", "scheduled", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${allDrives.length})` : f === "scheduled" ? `Upcoming (${upcoming.length})` : `Completed (${completed.length})`}
          </button>
        ))}
      </div>

      {/* Drive cards */}
      <div className="space-y-4">
        {list.length === 0 && (
          <Empty>No placement drives match the selected filter.</Empty>
        )}
        {list.map((d) => {
          const isRegistered = registered.has(d.id);
          const isPast = d.status === "completed";
          const driveDate = new Date(d.drive_date);
          const daysUntil = Math.ceil((driveDate.getTime() - Date.now()) / 86400000);

          return (
            <div
              key={d.id}
              className={`rounded-lg border bg-card p-5 transition-colors ${isPast ? "opacity-70" : "hover:border-accent/40"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{d.title}</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${
                        d.status === "scheduled"
                          ? "bg-accent/10 text-accent"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {d.status}
                    </span>
                    {isRegistered && (
                      <span className="flex items-center gap-1 rounded bg-success/10 px-2 py-0.5 text-xs text-success">
                        <CheckCircle2 className="h-3 w-3" /> Registered
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> {d.company.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {driveDate.toLocaleDateString(undefined, { dateStyle: "long" })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {d.venue}
                    </span>
                    {!isPast && daysUntil > 0 && (
                      <span className="flex items-center gap-1.5 text-warning">
                        <Clock className="h-3.5 w-3.5" />
                        {daysUntil === 1 ? "Tomorrow!" : `In ${daysUntil} days`}
                      </span>
                    )}
                    {!isPast && daysUntil <= 0 && (
                      <span className="text-success">Today!</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {!isPast ? (
                    <Button
                      size="sm"
                      variant={isRegistered ? "outline" : "default"}
                      disabled={isRegistered}
                      onClick={() => !isRegistered && handleRegister(d.id, d.title, d.company.name)}
                    >
                      {isRegistered ? "Registered ✓" : "Register"}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Drive concluded</span>
                  )}
                </div>
              </div>

              {d.status === "scheduled" && !isRegistered && (
                <div className="mt-3 rounded-md bg-accent/5 border border-accent/20 px-3 py-2 text-xs text-muted-foreground">
                  💡 Register to receive drive updates and interview scheduling notifications.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="mt-6 flex items-start gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        <GraduationCap className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Placement drives are coordinated by your campus placement office. Contact the placement cell for eligibility criteria, role details, and compensation packages for each drive.
        </span>
      </div>
    </>
  );
}
