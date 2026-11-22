import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { myCompanyQuery } from "@/lib/recruiter-data";

export const Route = createFileRoute("/_authenticated/recruiter/new-job")({
  component: NewJob,
});

function NewJob() {
  const company = useQuery(myCompanyQuery);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (company.isLoading) return <Loading />;
  if (company.error) {
    return (
      <Empty>
        Recruiter company could not be loaded:{" "}
        {company.error instanceof Error ? company.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!company.data) return <Empty>Link your account to a company before posting jobs.</Empty>;
  const assignedCompany = company.data;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    const location = String(f.get("location") ?? "").trim();
    const description = String(f.get("description") ?? "").trim();
    if (!title || !location || !description) {
      toast.error("Job title, location, and description are required.");
      return;
    }

    const minimumCgpaInput = String(f.get("minimum_cgpa") ?? "").trim();
    const minimumCgpa = minimumCgpaInput ? Number(minimumCgpaInput) : null;
    if (
      minimumCgpa !== null &&
      (!Number.isFinite(minimumCgpa) || minimumCgpa < 0 || minimumCgpa > 10)
    ) {
      toast.error("Minimum CGPA must be between 0 and 10.");
      return;
    }
    setBusy(true);
    const { data: job, error } = await supabase
      .from("opportunities")
      .insert({
        company_id: assignedCompany.id,
        company_name: assignedCompany.name,
        title,
        job_type: String(f.get("job_type")),
        location,
        description,
        deadline: String(f.get("deadline")) || null,
        required_skills: String(f.get("required_skills") ?? "").trim() || null,
        minimum_cgpa: minimumCgpa,
      })
      .select("id")
      .single();
    if (error) {
      setBusy(false);
      toast.error(`Could not publish opportunity: ${error.message}`);
      return;
    }
    setBusy(false);
    toast.success("Opportunity published");
    qc.invalidateQueries({ queryKey: ["company-jobs"] });
    navigate({ to: "/recruiter" });
  }

  return (
    <>
      <PageHeader title="Create job" subtitle={`Posting for ${company.data.name}`} />
      <form onSubmit={onSubmit} className="max-w-3xl space-y-5 rounded-lg border bg-card p-6">
        <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm text-muted-foreground">
          Salary and branch eligibility are not represented in the current opportunities table.
          Minimum CGPA and required skills are stored directly.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <F l="Job title">
            <Input name="title" maxLength={120} required />
          </F>
          <F l="Type">
            <select name="job_type" className="h-9 w-full rounded-md border bg-card px-3 text-sm">
              <option>Full-time</option>
              <option>Internship</option>
            </select>
          </F>
          <F l="Location">
            <Input
              name="location"
              maxLength={80}
              defaultValue={company.data.location ?? ""}
              required
            />
          </F>
          <F l="CTC (LPA)">
            <Input name="ctc" type="number" step="0.1" disabled placeholder="Not supported" />
          </F>
          <F l="Application deadline">
            <Input name="deadline" type="date" />
          </F>
          <F l="Minimum CGPA">
            <Input name="minimum_cgpa" type="number" min={0} max={10} step={0.01} />
          </F>
        </div>
        <F l="Description">
          <Textarea name="description" maxLength={2000} rows={4} required />
        </F>
        <F l="Required skills">
          <Input name="required_skills" placeholder="Comma-separated skills" />
        </F>
        <Button disabled={busy}>Publish job</Button>
      </form>
    </>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{l}</Label>
      {children}
    </div>
  );
}
