import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Briefcase, Check, Eye, Filter, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { BRANCHES } from "@/lib/campus";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";
import { addMockJob, getMockJobs, updateMockApplicationStatus } from "@/lib/mock-data";
import { RECRUITER_STATUS_STYLES, formatDate, getStatusLabel } from "@/lib/recruiter-frontend";

export const Route = createFileRoute("/_authenticated/recruiter/jobs")({
  component: RecruiterJobs,
});

const statusOptions = ["all", "open", "closed", "draft"] as const;
type StatusFilter = (typeof statusOptions)[number];

function RecruiterJobs() {
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState({
    title: "", description: "", location: "", job_type: "Full-time", ctc_lpa: 8, salary_range: "", required_skills: ["JavaScript", "React"], preferred_skills: ["SQL"], min_cgpa: 7, eligible_branches: ["CSE", "IT"], max_backlogs: 0, deadline: "", openings: 1, status: "draft" as const,
  });

  const filteredJobs = useMemo(() => {
    return (jobs.data ?? []).filter((job) => {
      const matchesStatus = status === "all" || job.status === status;
      const haystack = `${job.title} ${job.location} ${job.description}`.toLowerCase();
      return matchesStatus && haystack.includes(search.trim().toLowerCase());
    });
  }, [jobs.data, search, status]);

  const saveJob = useMutation({
    mutationFn: async ({ formData, mode }: { formData: FormData; mode: "draft" | "publish" }) => {
      const job = addMockJob({
        title: String(formData.get("title") ?? "").trim(),
        company_id: company.data?.id ?? "c1",
        job_type: String(formData.get("job_type") ?? "Full-time"),
        location: String(formData.get("location") ?? "Bengaluru"),
        ctc_lpa: Number(formData.get("ctc_lpa") || 0),
        description: String(formData.get("description") ?? ""),
        min_cgpa: Number(formData.get("min_cgpa") || 0),
        max_backlogs: Number(formData.get("max_backlogs") || 0),
        eligible_branches: (String(formData.get("eligible_branches") ?? "").split(",").map((branch) => branch.trim()).filter(Boolean)).length ? String(formData.get("eligible_branches") ?? "").split(",").map((branch) => branch.trim()).filter(Boolean) : ["CSE", "IT"],
        deadline: String(formData.get("deadline") || ""),
        skill_ids: (String(formData.get("required_skills") ?? "").split(",").map((id) => id.trim()).filter(Boolean)),
      });
      return { job, mode };
    },
    onSuccess: (_result, variables) => {
      toast.success(variables.mode === "publish" ? "Job published successfully." : "Job draft saved.");
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
      navigate({ to: "/recruiter/jobs" });
    },
    onError: () => toast.error("Unable to save the job in demo mode."),
  });

  const closeJob = useMutation({
    mutationFn: async (jobId: string) => {
      const list = getMockJobs();
      const updated = list.map((job) => job.id === jobId ? { ...job, status: "closed" } : job);
      if (typeof window !== "undefined") window.localStorage.setItem("campuslink_demo_jobs", JSON.stringify(updated));
      return jobId;
    },
    onSuccess: () => {
      toast.success("Job closed.");
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
    },
  });

  function publishDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!form.get("title") || !form.get("description") || !form.get("location")) {
      toast.error("Title, description, and location are required.");
      return;
    }
    saveJob.mutate({ formData: form, mode: "publish" });
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveJob.mutate({ formData: form, mode: "draft" });
  }

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;

  return (
    <>
      <PageHeader title="Job management" subtitle="Create, review, and close roles without leaving demo mode." action={<Button onClick={() => setSelected("new")}><Plus className="mr-2 h-4 w-4" />Create job</Button>} />
      <div className="mb-5 flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs" className="pl-9" aria-label="Search jobs" /></div>
        <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="h-9 rounded-md border bg-card px-3 text-sm"><option value="all">All statuses</option>{statusOptions.filter((option) => option !== "all").map((option) => <option key={option} value={option}>{getStatusLabel(option)}</option>)}</select></div>
      </div>

      {filteredJobs.length === 0 ? <Empty>No jobs match the selected filters.</Empty> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredJobs.map((job) => (
            <article key={job.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{job.title}</div><div className="mt-1 text-sm text-muted-foreground">{job.location} · {job.job_type} · ₹{job.ctc_lpa} LPA</div></div><span className={`rounded px-2 py-1 text-xs font-semibold capitalize ${RECRUITER_STATUS_STYLES[job.status] ?? "bg-secondary"}`}>{job.status}</span></div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{job.description || "No description provided."}</p>
              <div className="mt-4 flex flex-wrap gap-1">{job.job_skills.slice(0, 4).map((skill) => <span key={skill.skill?.id ?? skill.skill?.name} className="rounded bg-secondary px-2 py-1 text-xs">{skill.skill?.name}</span>)}{job.job_skills.length > 4 && <span className="rounded bg-secondary px-2 py-1 text-xs">+{job.job_skills.length - 4}</span>}</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><div><span className="block">Applicants</span><strong className="text-foreground">{job.applications.length}</strong></div><div><span className="block">Deadline</span><strong className="text-foreground">{formatDate(job.deadline)}</strong></div></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setSelected(job.id); setDraft({ title: job.title, description: job.description, location: job.location, job_type: job.job_type, ctc_lpa: job.ctc_lpa, salary_range: "", required_skills: (job.job_skills ?? []).map((entry) => entry.skill?.name ?? "").filter(Boolean), preferred_skills: [], min_cgpa: job.min_cgpa, eligible_branches: job.eligible_branches, max_backlogs: job.max_backlogs, deadline: job.deadline ?? "", openings: 1, status: "draft" }); }}><Eye className="mr-2 h-4 w-4" />View</Button>
                <Button size="sm" variant="outline" onClick={() => { setSelected(job.id); setDraft({ title: job.title, description: job.description, location: job.location, job_type: job.job_type, ctc_lpa: job.ctc_lpa, salary_range: "", required_skills: (job.job_skills ?? []).map((entry) => entry.skill?.name ?? "").filter(Boolean), preferred_skills: [], min_cgpa: job.min_cgpa, eligible_branches: job.eligible_branches, max_backlogs: job.max_backlogs, deadline: job.deadline ?? "", openings: 1, status: "draft" }); }}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Close</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Close this job?</AlertDialogTitle><AlertDialogDescription>This hides the posting from candidates and keeps the existing applications available for review.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep open</AlertDialogCancel><AlertDialogAction onClick={() => closeJob.mutate(job.id)}>Close job</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-background p-5 shadow-2xl">
            <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">{selected === "new" ? "Create job" : "Job details"}</h2><p className="text-sm text-muted-foreground">Required fields are marked with an asterisk.</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Close job form"><X className="h-5 w-5" /></button></div>
            <form onSubmit={selected === "new" ? publishDraft : saveDraft} className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="title">Job title *</Label><Input id="title" name="title" required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="type">Employment type</Label><select id="type" name="job_type" value={draft.job_type} onChange={(event) => setDraft((current) => ({ ...current, job_type: event.target.value }))} className="h-9 w-full rounded-md border bg-card px-3 text-sm"><option>Full-time</option><option>Internship</option><option>Contract</option></select></div>
                <div className="space-y-2"><Label htmlFor="location">Location *</Label><Input id="location" name="location" required value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ctc">Salary / package (LPA)</Label><Input id="ctc" name="ctc_lpa" type="number" step="0.1" value={draft.ctc_lpa} onChange={(event) => setDraft((current) => ({ ...current, ctc_lpa: Number(event.target.value) }))} /></div>
                <div className="space-y-2"><Label htmlFor="deadline">Application deadline</Label><Input id="deadline" name="deadline" type="date" value={draft.deadline} onChange={(event) => setDraft((current) => ({ ...current, deadline: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="openings">Number of openings</Label><Input id="openings" name="openings" type="number" min={1} value={draft.openings} onChange={(event) => setDraft((current) => ({ ...current, openings: Number(event.target.value) }))} /></div>
                <div className="space-y-2"><Label htmlFor="min-cgpa">Minimum CGPA</Label><Input id="min-cgpa" name="min_cgpa" type="number" step="0.1" min={0} max={10} value={draft.min_cgpa} onChange={(event) => setDraft((current) => ({ ...current, min_cgpa: Number(event.target.value) }))} /></div>
                <div className="space-y-2"><Label htmlFor="backlogs">Backlog requirement</Label><Input id="backlogs" name="max_backlogs" type="number" min={0} max={10} value={draft.max_backlogs} onChange={(event) => setDraft((current) => ({ ...current, max_backlogs: Number(event.target.value) }))} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="description">Job description *</Label><Textarea id="description" name="description" required rows={5} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></div>
              <div className="space-y-2"><Label>Eligible branches</Label><div className="flex flex-wrap gap-2">{BRANCHES.map((branch) => <button key={branch} type="button" onClick={() => setDraft((current) => ({ ...current, eligible_branches: current.eligible_branches.includes(branch) ? current.eligible_branches.filter((item) => item !== branch) : [...current.eligible_branches, branch] }))} className={`rounded-md border px-2.5 py-1.5 text-sm ${draft.eligible_branches.includes(branch) ? "border-accent bg-accent/10 text-accent" : "bg-card text-muted-foreground"}`}>{branch}</button>)}</div><input type="hidden" name="eligible_branches" value={draft.eligible_branches.join(",")} /></div>
              <div className="space-y-2"><Label htmlFor="skills">Required skills</Label><Input id="skills" name="required_skills" value={draft.required_skills.join(", ")} onChange={(event) => setDraft((current) => ({ ...current, required_skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) }))} placeholder="React, TypeScript, SQL" /></div>
              <div className="space-y-2"><Label htmlFor="preferred">Preferred skills</Label><Input id="preferred" name="preferred_skills" value={draft.preferred_skills.join(", ")} onChange={(event) => setDraft((current) => ({ ...current, preferred_skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) }))} placeholder="Machine Learning, Cloud" /></div>
              <div className="flex flex-wrap gap-3 border-t pt-4"><Button type="submit">{selected === "new" ? "Publish job" : "Save changes"}</Button><Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button type="button" variant="secondary" onClick={(event) => { event.preventDefault(); const form = event.currentTarget.closest("form"); if (!form) return; saveJob.mutate({ formData: new FormData(form), mode: "draft" }); }}>Save draft</Button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
