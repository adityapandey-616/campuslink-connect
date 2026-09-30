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
import { BRANCHES } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/recruiter/new-job")({
  component: NewJob,
});

function NewJob() {
  const company = useQuery(myCompanyQuery);
  const skills = useQuery({ queryKey: ["skills"], queryFn: async () => (await supabase.from("skills").select("*").order("name")).data ?? [] });
  const [picked, setPicked] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>(["CSE", "IT"]);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (company.isLoading) return <Loading />;
  if (!company.data) return <Empty>Link your account to a company before posting jobs.</Empty>;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!branches.length) return toast.error("Select at least one branch");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: job, error } = await supabase.from("jobs").insert({
      company_id: company.data!.id,
      title: String(f.get("title")).slice(0, 120),
      job_type: String(f.get("job_type")),
      location: String(f.get("location")).slice(0, 80),
      ctc_lpa: Number(f.get("ctc")),
      description: String(f.get("description")).slice(0, 2000),
      min_cgpa: Number(f.get("min_cgpa")),
      max_backlogs: Number(f.get("max_backlogs")),
      eligible_branches: branches,
      deadline: String(f.get("deadline")) || null,
      created_by: u.user?.id,
    }).select("id").single();
    if (error) { setBusy(false); return toast.error(error.message); }
    if (picked.length) await supabase.from("job_skills").insert(picked.map((skill_id) => ({ job_id: job.id, skill_id })));
    setBusy(false);
    toast.success("Job published");
    qc.invalidateQueries({ queryKey: ["company-jobs"] });
    navigate({ to: "/recruiter" });
  }

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <>
      <PageHeader title="Create job" subtitle={`Posting for ${company.data.name}`} />
      <form onSubmit={onSubmit} className="max-w-3xl space-y-5 rounded-lg border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <F l="Job title"><Input name="title" required /></F>
          <F l="Type"><select name="job_type" className="h-9 w-full rounded-md border bg-card px-3 text-sm"><option>Full-time</option><option>Internship</option></select></F>
          <F l="Location"><Input name="location" defaultValue={company.data.location} /></F>
          <F l="CTC (LPA)"><Input name="ctc" type="number" step="0.1" required /></F>
          <F l="Minimum CGPA"><Input name="min_cgpa" type="number" step="0.1" defaultValue={6.5} /></F>
          <F l="Max backlogs"><Input name="max_backlogs" type="number" min={0} defaultValue={0} /></F>
          <F l="Application deadline"><Input name="deadline" type="date" /></F>
        </div>
        <F l="Description"><Textarea name="description" rows={4} /></F>
        <F l="Eligible branches">
          <div className="flex flex-wrap gap-2">{BRANCHES.map((b) => <Chip key={b} on={branches.includes(b)} onClick={() => toggle(branches, b, setBranches)}>{b}</Chip>)}</div>
        </F>
        <F l="Required skills">
          <div className="flex flex-wrap gap-2">{(skills.data ?? []).map((s) => <Chip key={s.id} on={picked.includes(s.id)} onClick={() => toggle(picked, s.id, setPicked)}>{s.name}</Chip>)}</div>
        </F>
        <Button disabled={busy}>Publish job</Button>
      </form>
    </>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{l}</Label>{children}</div>;
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-md border px-2.5 py-1 text-sm ${on ? "border-accent bg-accent/10 text-accent" : "text-muted-foreground"}`}>{children}</button>;
}
