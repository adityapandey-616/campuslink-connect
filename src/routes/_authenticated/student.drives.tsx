import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, CalendarDays, GraduationCap, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDemoPreviewRole } from "@/lib/auth-store";
import {
  liveStudentPlacementDrivesQuery,
  myDriveRegistrationsQuery,
  type LiveStudentPlacementDrive,
} from "@/lib/placement-drive-data";
import { myProfileQuery } from "@/lib/student-data";

export const Route = createFileRoute("/_authenticated/student/drives")({
  component: PlacementDrives,
});

function formatDriveDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function registrationUnavailableReason(drive: LiveStudentPlacementDrive, today: string) {
  if (drive.status !== "upcoming") return "Registration unavailable";
  if (drive.drive_date < today) return "Drive has passed";
  if (drive.registration_deadline < today) return "Registration closed";
  return null;
}

function PlacementDrives() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery(myProfileQuery);
  const drivesQuery = useQuery(liveStudentPlacementDrivesQuery);
  const registrationsQuery = useQuery({
    ...myDriveRegistrationsQuery(profileQuery.data?.id ?? ""),
    enabled: Boolean(profileQuery.data?.id),
  });
  const readOnlyPreview = getDemoPreviewRole() === "student";

  const register = useMutation({
    mutationFn: async ({
      drive,
      profileId,
    }: {
      drive: LiveStudentPlacementDrive;
      profileId: string;
    }) => {
      if (getDemoPreviewRole() === "student") {
        throw new Error("Registrations are disabled in the read-only preview.");
      }
      if (registrationUnavailableReason(drive, todayDate())) {
        throw new Error("Registration is closed for this drive.");
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user || userData.user.id !== profileId) {
        throw new Error("Your signed-in student profile could not be verified.");
      }

      const { data, error } = await supabase
        .from("drive_registrations")
        .insert({ drive_id: drive.id, profile_id: profileId })
        .select("id,drive_id,registered_at")
        .single();
      if (error?.code === "23505") {
        throw new Error("You are already registered for this drive.");
      }
      if (error) throw new Error(`Could not register for this drive: ${error.message}`);
      return data;
    },
    onSuccess: (registration, variables) => {
      const queryKey = myDriveRegistrationsQuery(variables.profileId).queryKey;
      queryClient.setQueryData(queryKey, (current = []) => [...current, registration]);
      queryClient.invalidateQueries({ queryKey });
      toast.success("You are registered for this placement drive.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not register for this drive."),
  });

  if (profileQuery.isLoading || drivesQuery.isLoading) return <Loading />;
  if (profileQuery.error) {
    return (
      <Empty>
        Your student profile could not be loaded:{" "}
        {profileQuery.error instanceof Error
          ? profileQuery.error.message
          : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!profileQuery.data) {
    return <Empty>A student profile is not available for this account.</Empty>;
  }
  if (drivesQuery.error) {
    return (
      <Empty>
        Live placement drives could not be loaded:{" "}
        {drivesQuery.error instanceof Error ? drivesQuery.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  const drives = drivesQuery.data ?? [];
  const registeredDriveIds = new Set(
    (registrationsQuery.data ?? []).map((registration) => registration.drive_id),
  );
  const today = todayDate();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Placement Drives"
        subtitle="Live campus drives, registration deadlines, and published eligibility requirements."
      />
      {registrationsQuery.error && (
        <p role="alert" className="text-sm text-destructive">
          Your registration status could not be loaded:{" "}
          {registrationsQuery.error instanceof Error
            ? registrationsQuery.error.message
            : "Unknown Supabase error"}
        </p>
      )}
      {readOnlyPreview && (
        <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          This demo preview is read-only. You cannot register for drives here.
        </p>
      )}
      {drives.length === 0 ? (
        <Empty>
          <GraduationCap className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p>No placement drives are currently available.</p>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {drives.map((drive) => {
            const isRegistered = registeredDriveIds.has(drive.id);
            const unavailableReason = registrationUnavailableReason(drive, today);
            const canRegister =
              !readOnlyPreview &&
              !registrationsQuery.isPending &&
              !registrationsQuery.error &&
              !unavailableReason &&
              !isRegistered;

            return (
              <article key={drive.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{drive.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <BriefcaseBusiness className="h-4 w-4 shrink-0" />
                      {drive.company?.name ?? "Company unavailable"}
                    </p>
                  </div>
                  <Badge variant={drive.status === "cancelled" ? "destructive" : "secondary"}>
                    {drive.status}
                  </Badge>
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
                  <p className="text-xs text-muted-foreground">
                    These are the published requirements; eligibility is not automatically verified.
                  </p>
                </div>
                <div className="mt-4 flex justify-end border-t pt-3">
                  <Button
                    size="sm"
                    disabled={!canRegister || register.isPending}
                    onClick={() => register.mutate({ drive, profileId: profileQuery.data.id })}
                  >
                    {isRegistered
                      ? "Registered"
                      : registrationsQuery.isPending
                        ? "Checking..."
                        : readOnlyPreview
                          ? "Preview only"
                          : (unavailableReason ?? "Register")}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
