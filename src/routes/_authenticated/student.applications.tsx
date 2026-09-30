import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { myApplicationsQuery } from "@/lib/student-data";
import { statusStyles } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/student/applications")({
  component: Applications,
});

const steps = ["applied", "shortlisted", "interview", "offered", "joined"];

function Applications() {
  const apps = useQuery(myApplicationsQuery);
  const qc = useQueryClient();
  const respond = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("offers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Offer response saved"); qc.invalidateQueries({ queryKey: ["my-applications"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (apps.isLoading) return <Loading />;
  const list = apps.data ?? [];
  return (
    <>
      <PageHeader title="Applications & Offers" subtitle="Track every application from submission to joining." />
      {list.length === 0 && <Empty>You haven't applied anywhere yet. Head to Opportunities to find your best matches.</Empty>}
      <div className="space-y-3">
        {list.map((a) => {
          const idx = steps.indexOf(a.status);
          const offer = a.offers?.[0] ?? (Array.isArray(a.offers) ? undefined : (a.offers as unknown as { id: string; ctc_lpa: number; joining_date: string | null; status: string } | null));
          return (
            <div key={a.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{a.job?.title} · {a.job?.company?.name}</div>
                  <div className="text-sm text-muted-foreground">Applied {new Date(a.created_at).toLocaleDateString()} · Match {a.match_score}%</div>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[a.status]}`}>{a.status}</span>
              </div>
              {a.status !== "rejected" && (
                <div className="mt-4 flex gap-1">
                  {steps.map((s, i) => (
                    <div key={s} className="flex-1">
                      <div className={`h-1.5 rounded-full ${i <= idx ? "bg-accent" : "bg-muted"}`} />
                      <div className="mt-1 text-[11px] capitalize text-muted-foreground">{s}</div>
                    </div>
                  ))}
                </div>
              )}
              {a.interviews.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  {a.interviews.map((i) => <div key={i.id}>{i.round} · {new Date(i.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · {i.mode}</div>)}
                </div>
              )}
              {offer && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-success/10 p-3 text-sm">
                  <div><span className="font-medium">Offer: ₹{offer.ctc_lpa} LPA</span> · Joining {offer.joining_date ?? "TBD"} · <span className="capitalize">{offer.status}</span></div>
                  {offer.status === "released" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => respond.mutate({ id: offer.id, status: "accepted" })}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => respond.mutate({ id: offer.id, status: "declined" })}>Decline</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
