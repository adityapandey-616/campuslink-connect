import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { jobsQuery, matchFor, meQuery, myApplicationsQuery, type Job } from "@/lib/student-data";

export const Route = createFileRoute("/_authenticated/student/opportunities")({
  component: Opportunities,
});

function Opportunities() {
  const me = useQuery(meQuery);
  const jobs = useQuery(jobsQuery);
  const apps = useQuery(myApplicationsQuery);
  const qc = useQueryClient();
  const [open, setOpen] = useState<Job | null>(null);
  const [onlyEligible, setOnlyEligible] = useState(false);

  const apply = useMutation({
    mutationFn: async ({ job, score }: { job: Job; score: number }) => {
      const { error } = await supabase.from("applications").insert({ job_id: job.id, student_id: me.data!.student.id, match_score: score });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Application submitted"); qc.invalidateQueries({ queryKey: ["my-applications"] }); setOpen(null); },
    onError: (e) => toast.error(e.message),
  });

  if (me.isLoading || jobs.isLoading) return <Loading />;
  if (!me.data) return <Empty>Couldn't load your profile.</Empty>;
  const applied = new Set((apps.data ?? []).map((a) => a.job_id));
  const list = (jobs.data ?? []).map((j) => ({ j, r: matchFor(me.data!, j) })).filter((x) => !onlyEligible || x.r.eligible).sort((a, b) => b.r.score - a.r.score);
  const sel = open ? matchFor(me.data, open) : null;

  return (
    <>
      <PageHeader
        title="Opportunities"
        subtitle="Ranked by how well each role matches your profile."
        action={<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} /> Eligible only</label>}
      />
      <div className="grid gap-3">
        {list.length === 0 && <Empty>No open roles match your filters.</Empty>}
        {list.map(({ j, r }) => (
          <button key={j.id} onClick={() => setOpen(j)} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-accent/50">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{j.title}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{j.job_type}</span>
                {applied.has(j.id) && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-xs text-accent">Applied</span>}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">{j.company?.name} · {j.location} · ₹{j.ctc_lpa} LPA · Min CGPA {j.min_cgpa}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {j.skills.map((s) => <span key={s.id} className={`rounded px-1.5 py-0.5 text-xs ${r.matched.some((m) => m.id === s.id) ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{s.name}</span>)}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-display text-2xl font-semibold ${r.eligible ? "text-accent" : "text-muted-foreground"}`}>{r.score}%</div>
              <div className="text-xs text-muted-foreground">{r.eligible ? "match" : "not eligible"}</div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          {open && sel && (
            <>
              <DialogHeader><DialogTitle>{open.title} · {open.company?.name}</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">{open.description}</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <Info k="CTC" v={`₹${open.ctc_lpa} LPA`} /><Info k="Location" v={open.location} /><Info k="Deadline" v={open.deadline ?? "—"} />
                <Info k="Min CGPA" v={String(open.min_cgpa)} /><Info k="Max backlogs" v={String(open.max_backlogs)} /><Info k="Branches" v={open.eligible_branches.join(", ")} />
              </div>
              <div>
                <div className="text-sm font-semibold">Why you match · {sel.score}%</div>
                <ul className="mt-1 space-y-1 text-sm">
                  {sel.reasons.map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-success" />{x}</li>)}
                  {sel.blockers.map((x) => <li key={x} className="flex gap-2 text-destructive"><X className="mt-0.5 h-4 w-4" />{x}</li>)}
                </ul>
              </div>
              {sel.missing.length > 0 && (
                <div>
                  <div className="text-sm font-semibold">Skill gaps</div>
                  <p className="text-sm text-muted-foreground">Learn {sel.missing.map((m) => m.name).join(", ")} to raise your match to 100% skill coverage.</p>
                </div>
              )}
              <Button disabled={!sel.eligible || applied.has(open.id) || apply.isPending} onClick={() => apply.mutate({ job: open, score: sel.score })}>
                {applied.has(open.id) ? "Already applied" : !sel.eligible ? "Not eligible" : "Apply now"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return <div className="rounded-md bg-secondary p-2"><div className="text-xs text-muted-foreground">{k}</div><div className="font-medium">{v}</div></div>;
}
