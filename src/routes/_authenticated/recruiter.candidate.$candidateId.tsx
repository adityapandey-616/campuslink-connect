import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, BookOpen, BriefcaseBusiness, CalendarPlus, CheckCircle2, FileText, Mail, MapPin, Phone, Star, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { BRANCHES } from "@/lib/campus";
import { MOCK_ALL_STUDENTS, addMockInterview, updateMockApplicationStatus } from "@/lib/mock-data";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";
import { getCandidateMatch, getCandidateSummary } from "@/lib/recruiter-frontend";

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

  const student = useMemo(() => MOCK_ALL_STUDENTS.find((item) => item.id === candidateId), [candidateId]);
  const availableJobs = jobs.data ?? [];
  const candidateJob = availableJobs.find((job) => job.id === jobId) ?? availableJobs[0] ?? null;
  const candidateSummary = student ? getCandidateSummary(student) : null;
  const match = candidateJob && candidateSummary ? getCandidateMatch(candidateSummary, {
    ...candidateJob,
    skills: (candidateJob.job_skills ?? []).map((entry) => entry.skill).filter((skill): skill is { id: string; name: string } => Boolean(skill)),
  }) : null;
  const applications = useMemo(() => (jobs.data ?? []).flatMap((job) => job.applications.filter((application) => application.student.id === candidateId).map((application) => ({ ...application, job }))), [candidateId, jobs.data]);

  const changeStatus = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      updateMockApplicationStatus(applicationId, status);
      if (status === "interview") {
        const when = new Date(Date.now() + 3 * 86400000).toISOString();
        addMockInterview(applicationId, { round: "Technical Round 1", scheduled_at: when, mode: "Online", location: "Skill to Hire Interview" });
      }
      return status;
    },
    onSuccess: (_result, variables) => {
      toast.success(`Candidate marked ${variables.status}.`);
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
    },
  });

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;
  if (!student || !candidateSummary) return <Empty>The selected candidate could not be found.</Empty>;

  return (
    <>
      <PageHeader title={student.full_name} subtitle={`${student.branch} · CGPA ${student.cgpa} · ${student.placement_status}`} action={<Button variant="outline" onClick={() => navigate({ to: "/recruiter/discover" })}>Back to discovery</Button>} />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4 rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-lg font-semibold text-accent">{student.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><div className="font-semibold">{student.full_name}</div><div className="text-sm text-muted-foreground">{student.roll_no ?? "Student profile"}</div></div></div>
          <div className="grid gap-2 text-sm"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{student.email}</div><div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{student.phone ?? "Not provided"}</div><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Bengaluru, India</div></div>
          <div className="rounded-md bg-secondary/50 p-3 text-sm"><div className="font-medium">Readiness</div><div className="mt-2 flex items-end justify-between"><span className="font-display text-2xl font-bold text-accent">{candidateSummary.readiness}%</span><span className="text-xs text-muted-foreground">{candidateSummary.projects} projects</span></div></div>
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => setDialogOpen(true)}><CalendarPlus className="mr-2 h-4 w-4" />Schedule interview</Button><Button size="sm" variant="outline" onClick={() => changeStatus.mutate({ applicationId: applications[0]?.id ?? "", status: "shortlisted" })}>Shortlist</Button><Button size="sm" variant="outline" onClick={() => changeStatus.mutate({ applicationId: applications[0]?.id ?? "", status: "rejected" })}>Reject</Button></div>
        </aside>
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Profile snapshot</h2>{match && <span className="rounded bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">{match.score}% match</span>}</div>
            <p className="mt-3 text-sm text-muted-foreground">{student.bio ?? "No profile summary has been added yet."}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-md bg-secondary/50 p-3"><div className="text-xs text-muted-foreground">CGPA</div><div className="font-semibold">{student.cgpa}</div></div><div className="rounded-md bg-secondary/50 p-3"><div className="text-xs text-muted-foreground">Backlogs</div><div className="font-semibold">{student.backlogs}</div></div><div className="rounded-md bg-secondary/50 p-3"><div className="text-xs text-muted-foreground">Availability</div><div className="font-semibold">Available</div></div></div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Education</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Branch</div><div className="mt-1 font-medium">{student.branch}</div></div><div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Academic year</div><div className="mt-1 font-medium">{student.batch_year ?? "2025"}</div></div><div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Class 12</div><div className="mt-1 font-medium">{student.twelfth_pct ?? "—"}%</div></div><div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Class 10</div><div className="mt-1 font-medium">{student.tenth_pct ?? "—"}%</div></div></div>
          </section>

          <section className="rounded-lg border bg-card p-5"><h2 className="font-semibold">Skills</h2><div className="mt-3 flex flex-wrap gap-2">{candidateSummary.skills.length ? candidateSummary.skills.map((skill) => <span key={skill.id} className="rounded bg-accent/10 px-2.5 py-1 text-xs text-accent">{skill.name}</span>) : <span className="text-sm text-muted-foreground">No skills added.</span>}</div></section>
          <section className="rounded-lg border bg-card p-5"><h2 className="font-semibold">Projects & certifications</h2><div className="mt-3 grid gap-3 md:grid-cols-2">{student.projects?.length ? student.projects.map((project, index) => <div key={project.id ?? index} className="rounded-md border p-3"><div className="font-medium">{project.title ?? `Project ${index + 1}`}</div><p className="mt-1 text-sm text-muted-foreground">{project.description ?? "No description."}</p><div className="mt-2 text-xs text-muted-foreground">{project.tech ?? "Technology stack not listed"}</div></div>) : <p className="text-sm text-muted-foreground">No projects listed.</p>} {student.certifications?.length ? student.certifications.map((certification, index) => <div key={certification.id ?? index} className="rounded-md border p-3"><div className="font-medium">{certification.name ?? "Certification"}</div><div className="text-xs text-muted-foreground">{certification.issuer ?? "Issuer not listed"}</div></div>) : null}</div></section>
          {match && <section className="rounded-lg border bg-card p-5"><h2 className="font-semibold">Matching explanation</h2><div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]"><div className="rounded-md border p-3"><div className="flex items-center gap-2"><Star className="h-4 w-4 text-accent" />Matching skills</div><div className="mt-2 flex flex-wrap gap-1">{match.matched.length ? match.matched.map((skill) => <span key={skill.id} className="rounded bg-success/10 px-2 py-1 text-xs text-success">{skill.name}</span>) : <span className="text-sm text-muted-foreground">No direct skill matches.</span>}</div></div><div className="rounded-md border p-3"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Missing skills</div><div className="mt-2 flex flex-wrap gap-1">{match.missing.length ? match.missing.map((skill) => <span key={skill.id} className="rounded bg-muted px-2 py-1 text-xs">{skill.name}</span>) : <span className="text-sm text-muted-foreground">No visible skill gaps.</span>}</div></div></div><p className="mt-4 text-sm text-muted-foreground">{match.explanation}</p><div className="mt-3 flex flex-wrap gap-2">{match.blockers.length ? match.blockers.map((blocker) => <span key={blocker} className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">{blocker}</span>) : <span className="rounded bg-success/10 px-2 py-1 text-xs text-success">Eligible for this role</span>}</div></section>}
          <section className="rounded-lg border bg-card p-5"><h2 className="font-semibold">Application history</h2><div className="mt-3 space-y-2">{applications.length ? applications.map((application) => <div key={application.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><div className="font-medium">{application.job.title}</div><div className="text-xs text-muted-foreground">{application.status} · Match {application.match_score}%</div></div><span className="rounded bg-secondary px-2 py-1 text-xs">{application.job.location}</span></div>) : <p className="text-sm text-muted-foreground">No recorded applications for this candidate.</p>}</div></section>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Schedule interview</DialogTitle></DialogHeader><form className="space-y-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); if (!candidateJob || !applications[0]) return; addMockInterview(applications[0].id, { round: String(form.get("round") || "Technical Round 1"), scheduled_at: new Date(String(form.get("when") || Date.now())).toISOString(), mode: String(form.get("mode") || "Online"), location: String(form.get("location") || "Online") }); updateMockApplicationStatus(applications[0].id, "interview"); toast.success("Interview scheduled."); qc.invalidateQueries({ queryKey: ["company-jobs"] }); setDialogOpen(false); }}><select name="mode" className="h-9 w-full rounded-md border bg-card px-3 text-sm"><option value="Online">Online</option><option value="On-campus">On-campus</option><option value="Hybrid">Hybrid</option></select><input name="when" type="datetime-local" required className="h-9 w-full rounded-md border bg-card px-3 text-sm" /><input name="round" placeholder="Round name" defaultValue="Technical Round 1" className="h-9 w-full rounded-md border bg-card px-3 text-sm" /><input name="location" placeholder="Meeting link or venue" defaultValue="Online" className="h-9 w-full rounded-md border bg-card px-3 text-sm" /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Confirm</Button></div></form></DialogContent></Dialog>
    </>
  );
}
