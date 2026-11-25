import { createFileRoute } from "@tanstack/react-router";
import { BriefcaseBusiness, CalendarDays, GraduationCap, MapPin, Users } from "lucide-react";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { liveStudentPlacementDrivesQuery } from "@/lib/placement-drive-data";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/student/drives")({
  component: PlacementDrives,
});

function formatDriveDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function PlacementDrives() {
  const drivesQuery = useQuery(liveStudentPlacementDrivesQuery);

  if (drivesQuery.isLoading) return <Loading />;
  if (drivesQuery.error) {
    return (
      <Empty>
        Live placement drives could not be loaded:{" "}
        {drivesQuery.error instanceof Error ? drivesQuery.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  const drives = drivesQuery.data ?? [];
  return (
    <div className="space-y-5">
      <PageHeader
        title="Placement Drives"
        subtitle="Upcoming campus opportunities, dates, deadlines, and eligibility requirements."
      />
      {drives.length === 0 ? (
        <Empty>
          <GraduationCap className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p>No upcoming placement drives are currently available.</p>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {drives.map((drive) => (
            <article key={drive.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold">{drive.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <BriefcaseBusiness className="h-4 w-4 shrink-0" />
                    {drive.company?.name ?? "Company unavailable"}
                  </p>
                </div>
                <Badge variant="secondary">{drive.status}</Badge>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Drive date: {formatDriveDate(drive.drive_date)}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Registration deadline: {formatDriveDate(drive.registration_deadline)}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {drive.location}
              </p>
              {drive.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {drive.description}
                </p>
              )}
              <div className="mt-4 space-y-2 border-t pt-3 text-sm">
                <p>
                  <span className="font-medium">Minimum CGPA:</span>{" "}
                  {drive.minimum_cgpa ?? "Not specified"}
                </p>
                <p className="flex items-start gap-1.5">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="font-medium">Eligible branches:</span>{" "}
                    {drive.eligible_branches || "Not specified"}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
