import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Eye, Filter, Pencil, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { companyJobsQuery, myCompanyQuery, parseRequiredSkills } from "@/lib/recruiter-data";
import { supabase } from "@/integrations/supabase/client";
import { RECRUITER_STATUS_STYLES, formatDate, getStatusLabel } from "@/lib/recruiter-frontend";

export const Route = createFileRoute("/_authenticated/recruiter/jobs")({
  component: RecruiterJobs,
});

const statusOptions = ["all", "open", "closed"] as const;
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
    title: "",
    description: "",
    location: "",
    job_type: "Full-time",
    deadline: "",
    required_skills: "",
    minimum_cgpa: "",
  });

  const filteredJobs = useMemo(() => {
    return (jobs.data ?? []).filter((job) => {
      const matchesStatus = status === "all" || job.status === status;
      const haystack = `${job.title} ${job.location} ${job.description}`.toLowerCase();
      return matchesStatus && haystack.includes(search.trim().toLowerCase());
    });
  }, [jobs.data, search, status]);

  const saveJob = useMutation({
    mutationFn: async ({ formData }: { formData: FormData }) => {
      if (!company.data) throw new Error("Your recruiter account is not linked to a company.");
      const opportunity = {
        title: String(formData.get("title") ?? "").trim(),
        company_id: company.data.id,
        company_name: company.data.name,
        job_type: String(formData.get("job_type") ?? "Full-time"),
        location: String(formData.get("location") ?? "Bengaluru"),
        description: String(formData.get("description") ?? ""),
        deadline: String(formData.get("deadline") || "") || null,
        required_skills: String(formData.get("required_skills") ?? "").trim() || null,
        minimum_cgpa: String(formData.get("minimum_cgpa") ?? "").trim()
          ? Number(formData.get("minimum_cgpa"))
          : null,
      };
      if (
        opportunity.minimum_cgpa !== null &&
        (!Number.isFinite(opportunity.minimum_cgpa) ||
          opportunity.minimum_cgpa < 0 ||
          opportunity.minimum_cgpa > 10)
      ) {
        throw new Error("Minimum CGPA must be between 0 and 10.");
      }
      const jobId = selected && selected !== "new" ? selected : null;
      if (jobId) {
        const { data, error } = await supabase
          .from("opportunities")
          .update(opportunity)
          .eq("id", jobId)
          .select("id")
          .maybeSingle();
        if (error) throw new Error(`Could not save opportunity: ${error.message}`);
        if (!data) throw new Error("No opportunity was updated under the current permissions.");
      } else {
        const { error } = await supabase.from("opportunities").insert(opportunity);
        if (error) throw new Error(`Could not save opportunity: ${error.message}`);
      }
    },
    onSuccess: () => {
      toast.success("Opportunity saved.");
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
      navigate({ to: "/recruiter/jobs" });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Unable to save the opportunity."),
  });

  function publishDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!form.get("title") || !form.get("description") || !form.get("location")) {
      toast.error("Title, description, and location are required.");
      return;
    }
    saveJob.mutate({ formData: form });
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveJob.mutate({ formData: form });
  }

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (company.error || jobs.error) {
    const error = company.error ?? jobs.error;
    return (
      <Empty>
        Live job records could not be loaded:{" "}
        {error instanceof Error ? error.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;

  return (
    <>
      <PageHeader
        title="Job management"
        subtitle="Create and edit opportunities linked to your company."
        action={
          <Button
            onClick={() => {
              setDraft({
                title: "",
                description: "",
                location: company.data?.location ?? "",
                job_type: "Full-time",
                deadline: "",
                required_skills: "",
                minimum_cgpa: "",
              });
              setSelected("new");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create job
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search jobs"
            className="pl-9"
            aria-label="Search jobs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="h-9 rounded-md border bg-card px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {statusOptions
              .filter((option) => option !== "all")
              .map((option) => (
                <option key={option} value={option}>
                  {getStatusLabel(option)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <Empty>No jobs match the selected filters.</Empty>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredJobs.map((job) => {
            const requiredSkills = parseRequiredSkills(job.required_skills);
            return (
              <article key={job.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{job.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {job.location} · {job.job_type} · Salary not represented in the current
                      opportunity type
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold capitalize ${RECRUITER_STATUS_STYLES[job.status] ?? "bg-secondary"}`}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {job.description || "No description provided."}
                </p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {requiredSkills.slice(0, 4).map((skill) => (
                    <span key={skill} className="rounded bg-secondary px-2 py-1 text-xs">
                      {skill}
                    </span>
                  ))}
                  {requiredSkills.length > 4 && (
                    <span className="rounded bg-secondary px-2 py-1 text-xs">
                      +{requiredSkills.length - 4}
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="block">Applicants</span>
                    <strong className="text-foreground">{job.applications.length}</strong>
                  </div>
                  <div>
                    <span className="block">Minimum CGPA</span>
                    <strong className="text-foreground">{job.minimum_cgpa ?? "Not set"}</strong>
                  </div>
                  <div>
                    <span className="block">Deadline</span>
                    <strong className="text-foreground">{formatDate(job.deadline)}</strong>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(job.id);
                      setDraft({
                        title: job.title,
                        description: job.description,
                        location: job.location,
                        job_type: job.job_type,
                        deadline: job.deadline ?? "",
                        required_skills: job.required_skills ?? "",
                        minimum_cgpa: job.minimum_cgpa?.toString() ?? "",
                      });
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(job.id);
                      setDraft({
                        title: job.title,
                        description: job.description,
                        location: job.location,
                        job_type: job.job_type,
                        deadline: job.deadline ?? "",
                        required_skills: job.required_skills ?? "",
                        minimum_cgpa: job.minimum_cgpa?.toString() ?? "",
                      });
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled
                    title="The current opportunities type does not include a status field."
                  >
                    Close unavailable
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-background p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {selected === "new" ? "Create job" : "Job details"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Required fields are marked with an asterisk.
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close job form">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={selected === "new" ? publishDraft : saveDraft}
              className="mt-5 space-y-5"
            >
              <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm text-muted-foreground">
                The current opportunities type includes title, type, location, description, and
                deadline, minimum CGPA, and required skills. Salary, branch eligibility, openings,
                and draft/published state are not represented.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">Job title *</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Employment type</Label>
                  <select
                    id="type"
                    name="job_type"
                    value={draft.job_type}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, job_type: event.target.value }))
                    }
                    className="h-9 w-full rounded-md border bg-card px-3 text-sm"
                  >
                    <option>Full-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    required
                    value={draft.location}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, location: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Application deadline</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={draft.deadline}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, deadline: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum-cgpa">Minimum CGPA</Label>
                  <Input
                    id="minimum-cgpa"
                    name="minimum_cgpa"
                    type="number"
                    min={0}
                    max={10}
                    step={0.01}
                    value={draft.minimum_cgpa}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, minimum_cgpa: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="required-skills">Required skills</Label>
                <Input
                  id="required-skills"
                  name="required_skills"
                  placeholder="Comma-separated skills"
                  value={draft.required_skills}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, required_skills: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Job description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </div>
              <div className="flex flex-wrap gap-3 border-t pt-4">
                <Button type="submit">{selected === "new" ? "Publish job" : "Save changes"}</Button>
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled
                  title="The live opportunities schema does not support draft state."
                >
                  Draft unavailable
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
