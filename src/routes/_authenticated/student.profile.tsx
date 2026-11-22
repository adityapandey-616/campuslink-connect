import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { myProfileQuery } from "@/lib/student-data";

export const Route = createFileRoute("/_authenticated/student/profile")({
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const profile = useQuery(myProfileQuery);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<{
    full_name: string;
    branch: string;
    graduation_year: string;
  } | null>(null);

  const updateProfile = useMutation({
    mutationFn: async (fields: {
      profileId: string;
      full_name: string;
      branch: string | null;
      graduation_year: number | null;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: fields.full_name,
          branch: fields.branch,
          graduation_year: fields.graduation_year,
        })
        .eq("id", fields.profileId)
        .select("id")
        .maybeSingle();

      if (error) throw new Error(`Could not update your profile: ${error.message}`);
      if (!data) {
        throw new Error(
          "Your profile was not updated. The current Supabase policy may not allow this change.",
        );
      }
    },
    onSuccess: () => {
      setDraft(null);
      toast.success("Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["my-live-profile"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update your profile."),
  });

  if (profile.isLoading) return <Loading />;
  if (profile.error) {
    return (
      <Empty>
        Live profile could not be loaded:{" "}
        {profile.error instanceof Error ? profile.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!profile.data) return <Empty>A student profile is not available for this account.</Empty>;
  const currentProfile = profile.data;

  const values = draft ?? {
    full_name: profile.data.full_name ?? "",
    branch: profile.data.branch ?? "",
    graduation_year: profile.data.graduation_year?.toString() ?? "",
  };

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.full_name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    const year = values.graduation_year.trim() ? Number(values.graduation_year) : null;
    if (year !== null && (!Number.isInteger(year) || year <= 0)) {
      toast.error("Enter a valid graduation year.");
      return;
    }

    updateProfile.mutate({
      profileId: currentProfile.id,
      full_name: values.full_name.trim(),
      branch: values.branch.trim() || null,
      graduation_year: year,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student profile"
        subtitle="Update the profile fields represented in the application's current Supabase types."
      />
      <form onSubmit={saveProfile} className="space-y-4 rounded-xl border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="student-name">Full name</Label>
            <Input
              id="student-name"
              value={values.full_name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...values,
                  ...current,
                  full_name: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-email">Email</Label>
            <Input id="student-email" value={profile.data.email ?? ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-role">Role</Label>
            <Input id="student-role" value={profile.data.role ?? "student"} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-branch">Branch</Label>
            <Input
              id="student-branch"
              value={values.branch}
              onChange={(event) =>
                setDraft((current) => ({
                  ...values,
                  ...current,
                  branch: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-graduation-year">Graduation year</Label>
            <Input
              id="student-graduation-year"
              type="number"
              min={1}
              step={1}
              value={values.graduation_year}
              onChange={(event) =>
                setDraft((current) => ({
                  ...values,
                  ...current,
                  graduation_year: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving..." : "Save profile"}
        </Button>
      </form>
      <section className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        Saving is subject to the existing Supabase row-level policies; a denied or filtered update
        will be reported. Academic metrics, skills, projects, certifications, documents, and
        placement status are held outside the profile fields edited here and have not been connected
        to this page or verified against deployed policies.
      </section>
    </div>
  );
}
