import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  adminPlacementDrivesQuery,
  type PlacementDrive,
  type PlacementDriveStatus,
} from "@/lib/placement-drive-data";
import { adminCompaniesQuery } from "@/lib/admin-live-data";
import type { Database } from "@/integrations/supabase/types";

type PlacementDriveFields = Omit<
  Database["public"]["Tables"]["placement_drives"]["Insert"],
  "created_at" | "id"
>;

const DRIVE_STATUSES: PlacementDriveStatus[] = ["upcoming", "ongoing", "completed", "cancelled"];
const EMPTY_DRIVES: PlacementDrive[] = [];

export const Route = createFileRoute("/_authenticated/admin/drives")({
  head: () => ({ meta: [{ title: "Placement Drives — Skill to Hire Admin" }] }),
  component: AdminDrivesPage,
});

function formatDriveDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function AdminDrivesPage() {
  const queryClient = useQueryClient();
  const drivesQuery = useQuery(adminPlacementDrivesQuery);
  const companiesQuery = useQuery(adminCompaniesQuery);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState<PlacementDrive | null>(null);

  const saveDrive = useMutation({
    mutationFn: async ({ id, fields }: { id: string | null; fields: PlacementDriveFields }) => {
      const request = id
        ? supabase.from("placement_drives").update(fields).eq("id", id)
        : supabase.from("placement_drives").insert(fields);
      const { data, error } = await request.select("id").maybeSingle();
      if (error) {
        throw new Error(`Could not ${id ? "update" : "create"} placement drive: ${error.message}`);
      }
      if (!data) {
        throw new Error("No placement drive was saved under the current permissions.");
      }
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.id ? "Placement drive updated." : "Placement drive created.");
      setDialogOpen(false);
      setEditingDrive(null);
      queryClient.invalidateQueries({ queryKey: ["admin-placement-drives"] });
      queryClient.invalidateQueries({ queryKey: ["live-student-placement-drives"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save placement drive."),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PlacementDriveStatus }) => {
      const { data, error } = await supabase
        .from("placement_drives")
        .update({ status })
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(`Could not update placement-drive status: ${error.message}`);
      if (!data) throw new Error("No placement drive was updated under the current permissions.");
    },
    onSuccess: () => {
      toast.success("Placement-drive status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-placement-drives"] });
      queryClient.invalidateQueries({ queryKey: ["live-student-placement-drives"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update drive status."),
  });

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const minimumCgpaValue = String(formData.get("minimum_cgpa") ?? "").trim();
    const minimumCgpa = minimumCgpaValue ? Number(minimumCgpaValue) : null;
    if (
      minimumCgpa !== null &&
      (!Number.isFinite(minimumCgpa) || minimumCgpa < 0 || minimumCgpa > 10)
    ) {
      toast.error("Minimum CGPA must be between 0 and 10.");
      return;
    }

    const driveDate = String(formData.get("drive_date") ?? "");
    const registrationDeadline = String(formData.get("registration_deadline") ?? "");
    if (registrationDeadline > driveDate) {
      toast.error("Registration deadline must be on or before the drive date.");
      return;
    }

    const fields: PlacementDriveFields = {
      company_id: String(formData.get("company_id") ?? ""),
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      drive_date: driveDate,
      registration_deadline: registrationDeadline,
      location: String(formData.get("location") ?? "").trim(),
      minimum_cgpa: minimumCgpa,
      eligible_branches: String(formData.get("eligible_branches") ?? "").trim(),
      status: editingDrive?.status ?? "upcoming",
    };
    if (
      !fields.company_id ||
      !fields.title ||
      !driveDate ||
      !registrationDeadline ||
      !fields.location
    ) {
      toast.error("Company, title, dates, and location are required.");
      return;
    }

    saveDrive.mutate({ id: editingDrive?.id ?? null, fields });
  };

  if (drivesQuery.isLoading || companiesQuery.isLoading) return <Loading />;
  const loadError = drivesQuery.error ?? companiesQuery.error;
  if (loadError) {
    return (
      <Empty>
        Placement drives could not be loaded:{" "}
        {loadError instanceof Error ? loadError.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  const drives = drivesQuery.data ?? EMPTY_DRIVES;
  const companies = companiesQuery.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Placement Drives"
        subtitle="Create and maintain live placement-drive schedules for students."
        action={
          <Button
            onClick={() => {
              setEditingDrive(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add drive
          </Button>
        }
      />

      {drives.length === 0 ? (
        <Empty>
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p>No placement drives have been created yet.</p>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {drives.map((drive) => {
            const company = companies.find((item) => item.id === drive.company_id);
            return (
              <article key={drive.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{drive.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0" />
                      {company?.name ?? "Company unavailable"}
                    </p>
                  </div>
                  <Badge variant={drive.status === "cancelled" ? "destructive" : "secondary"}>
                    {drive.status}
                  </Badge>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {formatDriveDate(drive.drive_date)} · Registration by{" "}
                  {formatDriveDate(drive.registration_deadline)}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {drive.location}
                </p>
                {drive.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    {drive.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Minimum CGPA: {drive.minimum_cgpa ?? "Not specified"}</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {drive.eligible_branches || "Branches not specified"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <select
                    aria-label={`Update ${drive.title} status`}
                    value={drive.status}
                    onChange={(event) => {
                      const status = DRIVE_STATUSES.find(
                        (candidate) => candidate === event.target.value,
                      );
                      if (status) updateStatus.mutate({ id: drive.id, status });
                    }}
                    disabled={updateStatus.isPending}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                  >
                    {DRIVE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingDrive(drive);
                      setDialogOpen(true);
                    }}
                  >
                    Edit drive
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingDrive(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingDrive ? "Edit placement drive" : "Create placement drive"}
            </DialogTitle>
          </DialogHeader>
          <form
            key={editingDrive?.id ?? "new"}
            onSubmit={handleSave}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              Company
              <select
                name="company_id"
                required
                defaultValue={editingDrive?.company_id ?? ""}
                className="h-10 rounded-md border bg-background px-3"
              >
                <option value="" disabled>
                  Select a company
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              Drive title
              <Input name="title" required defaultValue={editingDrive?.title ?? ""} />
            </label>
            <label className="grid gap-1.5 text-sm">
              Drive date
              <Input
                name="drive_date"
                type="date"
                required
                defaultValue={editingDrive?.drive_date ?? ""}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Registration deadline
              <Input
                name="registration_deadline"
                type="date"
                required
                defaultValue={editingDrive?.registration_deadline ?? ""}
              />
            </label>
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              Location
              <Input name="location" required defaultValue={editingDrive?.location ?? ""} />
            </label>
            <label className="grid gap-1.5 text-sm">
              Minimum CGPA
              <Input
                name="minimum_cgpa"
                type="number"
                min="0"
                max="10"
                step="0.01"
                defaultValue={editingDrive?.minimum_cgpa ?? ""}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Eligible branches
              <Input
                name="eligible_branches"
                placeholder="e.g. CSE, ECE"
                defaultValue={editingDrive?.eligible_branches ?? ""}
              />
            </label>
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              Description
              <textarea
                name="description"
                rows={4}
                defaultValue={editingDrive?.description ?? ""}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveDrive.isPending || companies.length === 0}>
                {saveDrive.isPending ? "Saving..." : editingDrive ? "Save changes" : "Create drive"}
              </Button>
            </div>
          </form>
          {companies.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add a company before creating a placement drive.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
