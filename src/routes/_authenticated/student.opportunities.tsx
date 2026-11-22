import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  liveStudentOpportunitiesQuery,
  myApplicationsQuery,
  myProfileQuery,
  type LiveStudentOpportunity,
} from "@/lib/student-data";

const EMPTY_OPPORTUNITIES: LiveStudentOpportunity[] = [];

export const Route = createFileRoute("/_authenticated/student/opportunities")({
  component: Opportunities,
});

function Opportunities() {
  const profile = useQuery(myProfileQuery);
  const opportunities = useQuery(liveStudentOpportunitiesQuery);
  const applications = useQuery(myApplicationsQuery);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<LiveStudentOpportunity | null>(null);
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("all");
  const [location, setLocation] = useState("all");

  const rows = opportunities.data ?? EMPTY_OPPORTUNITIES;
  const applicationIds = new Set(
    (applications.data ?? []).map((application) => application.opportunity_id),
  );
  const jobTypes = [...new Set(rows.map((item) => item.job_type))].sort();
  const locations = [...new Set(rows.map((item) => item.location))].sort();
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesSearch =
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.company?.name.toLowerCase().includes(needle) ||
        item.location.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle);
      const openByDeadline =
        !item.deadline || item.deadline >= new Date().toISOString().slice(0, 10);
      return (
        matchesSearch &&
        openByDeadline &&
        (jobType === "all" || item.job_type === jobType) &&
        (location === "all" || item.location === location)
      );
    });
  }, [rows, search, jobType, location]);

  const apply = useMutation({
    mutationFn: async (opportunity: LiveStudentOpportunity) => {
      if (!profile.data) throw new Error("Your student profile is not available.");
      if (opportunity.deadline && opportunity.deadline < new Date().toISOString().slice(0, 10)) {
        throw new Error("This opportunity has passed its deadline.");
      }

      const { data: existingApplication, error: existingApplicationError } = await supabase
        .from("applications")
        .select("id")
        .eq("profile_id", profile.data.id)
        .eq("opportunity_id", opportunity.id)
        .maybeSingle();
      if (existingApplicationError) {
        throw new Error(
          `Could not verify whether you already applied: ${existingApplicationError.message}`,
        );
      }
      if (existingApplication) throw new Error("You have already applied to this opportunity.");

      const { error } = await supabase.from("applications").insert({
        profile_id: profile.data.id,
        opportunity_id: opportunity.id,
        applied_at: new Date().toISOString(),
        status: "applied",
      });
      if (error?.code === "23505") {
        throw new Error("You have already applied to this opportunity.");
      }
      if (error) throw new Error(`Could not submit application: ${error.message}`);
    },
    onSuccess: () => {
      toast.success("Application submitted.");
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      setSelected(null);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not submit application."),
  });

  if (profile.isLoading || opportunities.isLoading || applications.isLoading) return <Loading />;
  const loadError = profile.error ?? opportunities.error ?? applications.error;
  if (loadError) {
    return (
      <Empty>
        Live opportunities could not be loaded:{" "}
        {loadError instanceof Error ? loadError.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!profile.data) return <Empty>A student profile is not available for this account.</Empty>;

  return (
    <>
      <PageHeader
        title="Opportunities"
        subtitle="Live opportunity listings. Matching and eligibility filters are unavailable because the current opportunities workflow is not connected to student skills or job requirements."
      />
      <div className="mb-5 grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search role, company, location"
            className="pl-9"
          />
        </div>
        <select
          value={jobType}
          onChange={(event) => setJobType(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All job types</option>
          {jobTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All locations</option>
          {locations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          {rows.length
            ? "No current opportunities match the filters."
            : "No live opportunities found."}
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((opportunity) => {
            const applied = applicationIds.has(opportunity.id);
            const requiredSkills =
              opportunity.required_skills
                ?.split(/[,\n;]/)
                .map((skill) => skill.trim())
                .filter(Boolean) ?? [];
            return (
              <article key={opportunity.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <Briefcase className="mt-1 h-5 w-5 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{opportunity.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {opportunity.company?.name ?? "Company unavailable"} · {opportunity.job_type}
                    </p>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {opportunity.location}
                </p>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                  {opportunity.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Minimum CGPA: {opportunity.minimum_cgpa ?? "Not specified"}
                </p>
                {requiredSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {requiredSkills.map((skill) => (
                      <span key={skill} className="rounded bg-secondary px-2 py-1 text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {opportunity.deadline
                      ? `Deadline ${new Date(opportunity.deadline).toLocaleDateString()}`
                      : "No deadline stored"}
                  </span>
                  <Button size="sm" disabled={applied} onClick={() => setSelected(opportunity)}>
                    {applied ? "Applied" : "View and apply"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selected.company?.name ?? "Company unavailable"} · {selected.job_type} ·{" "}
                {selected.location}
              </p>
              <p className="whitespace-pre-wrap text-sm">{selected.description}</p>
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Salary and branch eligibility are not represented by the current opportunities
                table. Listed skills and minimum CGPA are employer-provided only, not verified
                eligibility calculations.
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <Button onClick={() => apply.mutate(selected)} disabled={apply.isPending}>
                  {apply.isPending ? "Submitting..." : "Submit application"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
