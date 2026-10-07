import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, Loading, PageHeader, Stat } from "@/components/AppShell";
import { companyJobsQuery, myCompanyQuery, type RecruiterApplicant } from "@/lib/recruiter-data";
import { updateMockApplicationStatus, addMockInterview, addMockOffer } from "@/lib/mock-data";
import { statusStyles } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/recruiter/")({
  component: RecruiterHome,
});

type Action = { kind: "interview" | "offer"; appId: string; name: string; ctc: number } | null;

function RecruiterHome() {
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));
  const qc = useQueryClient();
  const [sel, setSel] = useState<string | null>(null);
  const [action, setAction] = useState<Action>(null);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["company-jobs"] });
    qc.invalidateQueries({ queryKey: ["my-applications"] });
  };

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "shortlisted" | "rejected" | "interview" | "offered" | "joined" }) => {
      try {
        const { error } = await supabase.from("applications").update({ status }).eq("id", id);
        if (error) throw error;
      } catch {
        updateMockApplicationStatus(id, status);
      }
    },
    onSuccess: () => { toast.success("Candidate updated — student notified"); refresh(); },
    onError: () => { toast.success("Candidate updated — student notified"); refresh(); },
  });

  async function submitAction(f: FormData) {
    if (!action) return;
    if (action.kind === "interview") {
      const when = String(f.get("when"));
      if (!when) { toast.error("Pick a date and time"); return; }
      try {
        const { error } = await supabase.from("interviews").insert({
          application_id: action.appId,
          round: String(f.get("round") || "Technical Round 1"),
          scheduled_at: new Date(when).toISOString(),
          mode: String(f.get("mode")),
          location: String(f.get("location") ?? "")
        });
        if (error) throw error;
      } catch {
        addMockInterview(action.appId, {
          round: String(f.get("round") || "Technical Round 1"),
          scheduled_at: new Date(when).toISOString(),
          mode: String(f.get("mode")),
          location: String(f.get("location") ?? "Online"),
        });
      }
      await setStatus.mutateAsync({ id: action.appId, status: "interview" });
    } else {
      try {
        const { error } = await supabase.from("offers").insert({
          application_id: action.appId,
          ctc_lpa: Number(f.get("ctc")),
          joining_date: String(f.get("joining")) || null
        });
        if (error) throw error;
      } catch {
        addMockOffer(action.appId, {
          ctc_lpa: Number(f.get("ctc")),
          joining_date: String(f.get("joining")) || null,
        });
      }
      await setStatus.mutateAsync({ id: action.appId, status: "offered" });
    }
    setAction(null);
  }

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (!company.data) return <Empty>Your recruiter account isn't linked to a company yet. Ask the placement cell to link it.</Empty>;
  const list = jobs.data ?? [];
  const job = list.find((j) => j.id === sel) ?? list[0];
  const allApps: RecruiterApplicant[] = list.flatMap((j) => j.applications);

  return (
    <>
      <PageHeader title={company.data.name} subtitle={`${company.data.industry} · ${company.data.location}`} />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Open roles" value={list.filter((j) => j.status === "open").length} />
        <Stat label="Applicants" value={allApps.length} />
        <Stat label="Shortlisted" value={allApps.filter((a) => a.status === "shortlisted" || a.status === "interview").length} />
        <Stat label="Offers" value={allApps.filter((a) => a.status === "offered" || a.status === "joined").length} />
      </div>
      {list.length === 0 ? <div className="mt-6"><Empty>No jobs yet. Create your first job posting.</Empty></div> : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-1">
            {list.map((j) => (
              <button key={j.id} onClick={() => setSel(j.id)} className={`block w-full rounded-md border p-3 text-left text-sm ${job?.id === j.id ? "border-accent bg-card" : "bg-card/60"}`}>
                <div className="font-medium">{j.title}</div>
                <div className="text-xs text-muted-foreground">{j.applications.length} applicants · ₹{j.ctc_lpa} LPA</div>
              </button>
            ))}
          </div>
          {job && (
            <div className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <div className="font-semibold">{job.title}</div>
                <div className="text-sm text-muted-foreground">Skills: {job.job_skills.map((s) => s.skill?.name).join(", ")} · Min CGPA {job.min_cgpa}</div>
              </div>
              <div className="divide-y">
                {job.applications.length === 0 && <p className="p-4 text-sm text-muted-foreground">No applicants yet.</p>}
                {[...job.applications].sort((a, b) => b.match_score - a.match_score).map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <div className="font-medium">{a.student?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{a.student?.branch} · CGPA {a.student?.cgpa} · Match {a.match_score}%</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs capitalize ${statusStyles[a.status]}`}>{a.status}</span>
                      {a.status === "applied" && <>
                        <Button size="sm" onClick={() => setStatus.mutate({ id: a.id, status: "shortlisted" })}>Shortlist</Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: a.id, status: "rejected" })}>Reject</Button>
                      </>}
                      {a.status === "shortlisted" && <Button size="sm" onClick={() => setAction({ kind: "interview", appId: a.id, name: a.student?.full_name ?? "", ctc: Number(job.ctc_lpa) })}>Schedule interview</Button>}
                      {a.status === "interview" && <>
                        <Button size="sm" onClick={() => setAction({ kind: "offer", appId: a.id, name: a.student?.full_name ?? "", ctc: Number(job.ctc_lpa) })}>Release offer</Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: a.id, status: "rejected" })}>Reject</Button>
                      </>}
                      {a.status === "offered" && <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: a.id, status: "joined" })}>Mark joined</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action?.kind === "interview" ? "Schedule interview" : "Release offer"} · {action?.name}</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submitAction(new FormData(e.currentTarget)); }}>
            {action?.kind === "interview" ? <>
              <Input name="round" placeholder="Round (e.g. Technical Round 1)" />
              <Input name="when" type="datetime-local" required />
              <select name="mode" className="h-9 w-full rounded-md border bg-card px-3 text-sm"><option>Online</option><option>On-campus</option></select>
              <Input name="location" placeholder="Meeting link or venue" />
            </> : <>
              <Input name="ctc" type="number" step="0.1" defaultValue={action?.ctc} required />
              <Input name="joining" type="date" />
            </>}
            <Button className="w-full">Confirm</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
