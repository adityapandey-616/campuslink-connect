import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Empty, Loading, PageHeader, Stat } from "@/components/AppShell";
import { jobsQuery, matchFor, meQuery, myApplicationsQuery } from "@/lib/student-data";
import { statusStyles } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentDashboard,
});

function StudentDashboard() {
  const me = useQuery(meQuery);
  const jobs = useQuery(jobsQuery);
  const apps = useQuery(myApplicationsQuery);
  const qc = useQueryClient();
  const notifs = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(8)).data ?? [],
  });
  const markRead = useMutation({
    mutationFn: async (id: string) => { await supabase.from("notifications").update({ read: true }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (me.isLoading || jobs.isLoading) return <Loading />;
  if (me.error || !me.data) return <Empty>We couldn't load your profile. Try refreshing.</Empty>;
  const m = me.data;
  const ranked = (jobs.data ?? []).map((j) => ({ j, r: matchFor(m, j) })).filter((x) => x.r.eligible).sort((a, b) => b.r.score - a.r.score).slice(0, 4);
  const upcoming = (apps.data ?? []).flatMap((a) => a.interviews.map((i) => ({ ...i, job: a.job }))).filter((i) => new Date(i.scheduled_at) > new Date()).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const gaps = new Map<string, number>();
  (jobs.data ?? []).forEach((j) => matchFor(m, j).missing.forEach((s) => gaps.set(s.name, (gaps.get(s.name) ?? 0) + 1)));
  const topGaps = [...gaps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <PageHeader title={`Hi, ${m.student.full_name.split(" ")[0]}`} subtitle={`${m.student.branch} · Batch ${m.student.batch_year} · CGPA ${m.student.cgpa}`} />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Readiness score" value={`${m.readiness.total}/100`} hint={m.readiness.total >= 70 ? "Placement ready" : "Room to improve"} />
        <Stat label="Applications" value={apps.data?.length ?? 0} />
        <Stat label="Upcoming interviews" value={upcoming.length} />
        <Stat label="Status" value={<span className="capitalize">{m.student.placement_status}</span>} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Top matches for you</h2>
            <Link to="/student/opportunities" className="text-sm text-accent">View all</Link>
          </div>
          <div className="mt-4 divide-y">
            {ranked.length === 0 && <p className="py-4 text-sm text-muted-foreground">No eligible roles yet — add skills to your profile to unlock matches.</p>}
            {ranked.map(({ j, r }) => (
              <div key={j.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-sm text-muted-foreground">{j.company?.name} · ₹{j.ctc_lpa} LPA</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-semibold text-accent">{r.score}%</div>
                  <div className="text-xs text-muted-foreground">match</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Readiness breakdown</h2>
          <div className="mt-4 space-y-3">
            {m.readiness.parts.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-sm"><span>{p.label}</span><span className="text-muted-foreground">{p.value}/{p.max}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${(p.value / p.max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          {topGaps.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <div className="text-sm font-medium">Skills most requested that you're missing</div>
              <div className="mt-2 flex flex-wrap gap-1.5">{topGaps.map(([n, c]) => <span key={n} className="rounded border bg-secondary px-2 py-0.5 text-xs">{n} · {c} roles</span>)}</div>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="font-semibold">Upcoming interviews</h2>
          <div className="mt-3 divide-y">
            {upcoming.length === 0 && <p className="py-3 text-sm text-muted-foreground">Nothing scheduled yet.</p>}
            {upcoming.map((i) => (
              <div key={i.id} className="flex justify-between py-3 text-sm">
                <div><div className="font-medium">{i.job?.title} · {i.job?.company?.name}</div><div className="text-muted-foreground">{i.round} · {i.mode}</div></div>
                <div className="text-right">{new Date(i.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
            ))}
          </div>
          {(apps.data?.length ?? 0) > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              {Object.entries((apps.data ?? []).reduce<Record<string, number>>((a, x) => ({ ...a, [x.status]: (a[x.status] ?? 0) + 1 }), {})).map(([s, c]) => (
                <span key={s} className={`rounded px-2 py-0.5 text-xs capitalize ${statusStyles[s]}`}>{s}: {c}</span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4" /> Notifications</h2>
          <div className="mt-3 space-y-2">
            {(notifs.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">You're all caught up.</p>}
            {(notifs.data ?? []).map((n) => (
              <button key={n.id} onClick={() => !n.read && markRead.mutate(n.id)} className={`block w-full rounded-md border p-2.5 text-left text-sm ${n.read ? "opacity-60" : "border-accent/40 bg-accent/5"}`}>
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.body}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
