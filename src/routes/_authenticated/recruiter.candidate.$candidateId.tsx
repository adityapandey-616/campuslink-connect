import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarPlus, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";

export const Route = createFileRoute("/_authenticated/recruiter/candidate/$candidateId")({
  component: CandidateDetail,
});

function CandidateDetail() {
  const { candidateId } = Route.useParams();
  const navigate = useNavigate();
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));
  const qc = useQueryClient();
  const [jobId, setJobId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const availableJobs = jobs.data ?? [];
  const candidateJob = availableJobs.find((job) => job.id === jobId) ?? availableJobs[0] ?? null;
  const applications = useMemo(
    () =>
      (jobs.data ?? []).flatMap((job) =>
        job.applications
          .filter((application) => application.student.id === candidateId)
          .map((application) => ({ ...application, job })),
      ),
    [candidateId, jobs.data],
  );
  const applicant = applications[0]?.student;
  const student = applicant
    ? {
        ...applicant,
        roll_no: null,
        phone: null,
        bio: null,
        placement_status: null,
        batch_year: applicant.graduation_year,
        tenth_pct: null,
        twelfth_pct: null,
        projects: [] as Array<{
          id?: string;
          title: string;
          description: string;
          tech: string;
        }>,
        certifications: [] as Array<{ id?: string; name: string; issuer: string }>,
      }
    : null;
  const candidateSummary: {
    readiness: number | null;
    projects: number | null;
    skills: Array<{ id: string; name: string }>;
  } | null = student ? { readiness: null, projects: null, skills: [] } : null;
  const changeStatus = useMutation({
    mutationFn: async ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: "shortlisted" | "rejected";
    }) => {
      const { data, error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", applicationId)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(`Could not update application status: ${error.message}`);
      if (!data) throw new Error("No application was updated under the current permissions.");
      return status;
    },
    onSuccess: (_result, variables) => {
      toast.success(`Application marked ${variables.status}.`);
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update application status."),
  });

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (company.error || jobs.error) {
    const error = company.error ?? jobs.error;
    return (
      <Empty>
        Candidate records could not be loaded:{" "}
        {error instanceof Error ? error.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;
  if (!student || !candidateSummary)
    return <Empty>The selected candidate could not be found.</Empty>;

  return (
    <>
      <PageHeader
        title={student.full_name}
        subtitle={`${student.branch ?? "Branch not available"} · Academic details are not joined into this candidate query`}
        action={
          <Button variant="outline" onClick={() => navigate({ to: "/recruiter/discover" })}>
            Back to discovery
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4 rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-lg font-semibold text-accent">
              {student.full_name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="font-semibold">{student.full_name}</div>
              <div className="text-sm text-muted-foreground">
                {student.roll_no ?? "Applicant profile"}
              </div>
            </div>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {student.email}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {student.phone ?? "Not stored in live profiles"}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Location is not stored in the current candidate query
            </div>
          </div>
          <div className="rounded-md bg-secondary/50 p-3 text-sm">
            <div className="font-medium">Readiness</div>
            <div className="mt-2 flex items-end justify-between">
              <span className="font-display text-2xl font-bold text-accent">
                {candidateSummary.readiness === null
                  ? "Unavailable"
                  : `${candidateSummary.readiness}%`}
              </span>
              <span className="text-xs text-muted-foreground">
                {candidateSummary.projects === null
                  ? "Project data unavailable"
                  : `${candidateSummary.projects} projects`}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Schedule interview
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                changeStatus.mutate({
                  applicationId: applications[0]?.id ?? "",
                  status: "shortlisted",
                })
              }
            >
              Shortlist
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                changeStatus.mutate({
                  applicationId: applications[0]?.id ?? "",
                  status: "rejected",
                })
              }
            >
              Reject
            </Button>
          </div>
        </aside>
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Profile snapshot</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {student.bio ?? "Profile summary is not stored in the live profiles schema."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-secondary/50 p-3">
                <div className="text-xs text-muted-foreground">CGPA</div>
                <div className="font-semibold">{student.cgpa ?? "Not stored"}</div>
              </div>
              <div className="rounded-md bg-secondary/50 p-3">
                <div className="text-xs text-muted-foreground">Backlogs</div>
                <div className="font-semibold">{student.backlogs ?? "Not stored"}</div>
              </div>
              <div className="rounded-md bg-secondary/50 p-3">
                <div className="text-xs text-muted-foreground">Availability</div>
                <div className="font-semibold">Not stored</div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Education</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Branch</div>
                <div className="mt-1 font-medium">{student.branch}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Graduating year</div>
                <div className="mt-1 font-medium">{student.batch_year ?? "Not stored"}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Class 12</div>
                <div className="mt-1 font-medium">{student.twelfth_pct ?? "—"}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Class 10</div>
                <div className="mt-1 font-medium">{student.tenth_pct ?? "—"}</div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {candidateSummary.skills.length ? (
                candidateSummary.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded bg-accent/10 px-2.5 py-1 text-xs text-accent"
                  >
                    {skill.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Skill records are not joined into this candidate query.
                </span>
              )}
            </div>
          </section>
          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Projects & certifications</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {student.projects?.length ? (
                student.projects.map((project, index) => (
                  <div key={project.id ?? index} className="rounded-md border p-3">
                    <div className="font-medium">{project.title ?? `Project ${index + 1}`}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.description ?? "No description."}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {project.tech ?? "Technology stack not listed"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Project records are not joined into this candidate query.
                </p>
              )}{" "}
              {student.certifications?.length
                ? student.certifications.map((certification, index) => (
                    <div key={certification.id ?? index} className="rounded-md border p-3">
                      <div className="font-medium">{certification.name ?? "Certification"}</div>
                      <div className="text-xs text-muted-foreground">
                        {certification.issuer ?? "Issuer not listed"}
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </section>
          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Matching analysis</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Matching is unavailable because this query does not join student skills, jobs, or job
              requirements. The current generated types do not define a relationship between jobs
              and opportunities.
            </p>
          </section>
          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Application history</h2>
            <div className="mt-3 space-y-2">
              {applications.length ? (
                applications.map((application) => (
                  <div
                    key={application.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div>
                      <div className="font-medium">{application.job.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {application.status} · Applied{" "}
                        {new Date(application.applied_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="rounded bg-secondary px-2 py-1 text-xs">
                      {application.job.location}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recorded applications for this candidate.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              if (!candidateJob || !applications[0]) return;
              const { error } = await supabase.from("interviews").insert({
                application_id: applications[0].id,
                scheduled_at: new Date(String(form.get("when"))).toISOString(),
                interview_type: "Interview",
                status: "scheduled",
              });
              if (error) {
                toast.error(`Could not schedule interview: ${error.message}`);
                return;
              }
              const { data: updatedApplication, error: statusError } = await supabase
                .from("applications")
                .update({ status: "interview" })
                .eq("id", applications[0].id)
                .select("id")
                .maybeSingle();
              if (statusError) {
                toast.error(
                  `Interview saved, but application status was not updated: ${statusError.message}`,
                );
              } else if (!updatedApplication) {
                toast.error(
                  "Interview saved, but no application status was updated under the current permissions.",
                );
              } else {
                toast.success("Interview scheduled.");
              }
              qc.invalidateQueries({ queryKey: ["company-jobs"] });
              setDialogOpen(false);
            }}
          >
            <input
              name="when"
              type="datetime-local"
              required
              className="h-9 w-full rounded-md border bg-card px-3 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Confirm</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
