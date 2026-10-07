import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Briefcase, Calendar, ChevronRight, ClipboardList,
  GraduationCap, Lightbulb, Star, TrendingUp, UserRound, X,
} from "lucide-react";
import { Empty, Loading, PageHeader, Stat } from "@/components/AppShell";
import { jobsQuery, matchFor, meQuery, myApplicationsQuery } from "@/lib/student-data";
import { statusStyles } from "@/lib/campus";
import {
  getMockNotifications,
  markNotificationRead,
  getMockDrives,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentDashboard,
});

function profileCompletion(me: { student: Record<string, unknown>; skills: unknown[]; projects: unknown[]; certs: unknown[]; docs: { status: string }[] }) {
  const checks: { label: string; done: boolean; action: string; to: string }[] = [
    { label: "Full name", done: Boolean(me.student["full_name"]), action: "Add your name", to: "/student/profile" },
    { label: "Roll number", done: Boolean(me.student["roll_no"]), action: "Add roll number", to: "/student/profile" },
    { label: "Phone number", done: Boolean(me.student["phone"]), action: "Add phone", to: "/student/profile" },
    { label: "Bio / About", done: Boolean(me.student["bio"]), action: "Write a bio", to: "/student/profile" },
    { label: "At least 3 skills", done: me.skills.length >= 3, action: "Add skills", to: "/student/profile" },
    { label: "At least 1 project", done: me.projects.length >= 1, action: "Add a project", to: "/student/profile" },
    { label: "At least 1 certification", done: me.certs.length >= 1, action: "Add a certification", to: "/student/profile" },
    { label: "Resume uploaded", done: me.docs.some((d) => d.status === "verified" && true), action: "Submit resume", to: "/student/profile" },
  ];
  const done = checks.filter((c) => c.done).length;
  return { pct: Math.round((done / checks.length) * 100), checks };
}

function categoryIcon(cat: string) {
  if (cat === "interview") return <Calendar className="h-3.5 w-3.5 text-warning" />;
  if (cat === "offer") return <Star className="h-3.5 w-3.5 text-success" />;
  if (cat === "drive") return <Briefcase className="h-3.5 w-3.5 text-accent" />;
  return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
}

function StudentDashboard() {
  const me = useQuery(meQuery);
  const jobs = useQuery(jobsQuery);
  const apps = useQuery(myApplicationsQuery);
  const qc = useQueryClient();

  const notifs = useQuery({
    queryKey: ["mock-notifications"],
    queryFn: getMockNotifications,
  });
  const drives = useQuery({
    queryKey: ["mock-drives"],
    queryFn: getMockDrives,
  });

  function handleMarkRead(id: string) {
    markNotificationRead(id);
    qc.invalidateQueries({ queryKey: ["mock-notifications"] });
  }

  if (me.isLoading || jobs.isLoading) return <Loading />;
  if (me.error || !me.data) return <Empty>We couldn't load your profile. Try refreshing.</Empty>;

  const m = me.data;
  const ranked = (jobs.data ?? [])
    .map((j) => ({ j, r: matchFor(m, j) }))
    .filter((x) => x.r.eligible)
    .sort((a, b) => b.r.score - a.r.score)
    .slice(0, 4);

  const upcoming = (apps.data ?? [])
    .flatMap((a) => a.interviews.map((i) => ({ ...i, job: a.job })))
    .filter((i) => new Date(i.scheduled_at) > new Date())
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const gaps = new Map<string, number>();
  (jobs.data ?? []).forEach((j) =>
    matchFor(m, j).missing.forEach((s) => gaps.set(s.name, (gaps.get(s.name) ?? 0) + 1))
  );
  const topGaps = [...gaps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const { pct, checks } = profileCompletion({
    student: m.student as Record<string, unknown>,
    skills: m.skills,
    projects: m.projects,
    certs: m.certs,
    docs: m.docs,
  });

  const upcomingDrives = (drives.data ?? [])
    .filter((d) => d.status === "scheduled")
    .sort((a, b) => a.drive_date.localeCompare(b.drive_date))
    .slice(0, 3);

  const unreadCount = (notifs.data ?? []).filter((n) => !n.read).length;
  const recentNotifs = (notifs.data ?? []).slice(0, 5);

  const readiness = m.readiness.total;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Hi, {m.student.full_name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {m.student.branch} · Batch {m.student.batch_year} · CGPA {m.student.cgpa}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/student/opportunities" className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90">
            <Briefcase className="h-3.5 w-3.5" /> View Opportunities
          </Link>
          <Link to="/student/profile" className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm font-medium hover:bg-secondary">
            <UserRound className="h-3.5 w-3.5" /> Complete Profile
          </Link>
          <Link to="/student/insights" className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm font-medium hover:bg-secondary">
            <TrendingUp className="h-3.5 w-3.5" /> Improve Skills
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Readiness score"
          value={`${readiness}/100`}
          hint={readiness >= 80 ? "Placement ready ✓" : readiness >= 60 ? "Good progress" : "Room to improve"}
        />
        <Stat label="Applications" value={apps.data?.length ?? 0} hint="View all →" />
        <Stat label="Upcoming interviews" value={upcoming.length} hint={upcoming.length === 0 ? "None scheduled" : undefined} />
        <Stat
          label="Placement status"
          value={<span className="capitalize">{m.student.placement_status}</span>}
          hint={m.student.placement_status === "placed" ? "Congratulations! 🎉" : undefined}
        />
      </div>

      {/* Profile completion banner */}
      {pct < 100 && (
        <div className="mt-5 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0">
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" strokeWidth="2.5"
                    stroke="currentColor" className="text-accent"
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeDashoffset="0" strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{pct}%</span>
              </div>
              <div>
                <div className="font-medium">Profile Completion — {pct}%</div>
                <div className="text-sm text-muted-foreground">Complete your profile to improve your readiness score and match quality.</div>
              </div>
            </div>
            <Link to="/student/profile" className="shrink-0 text-sm text-accent hover:underline">
              Complete now →
            </Link>
          </div>
          {pct < 100 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
              {checks.filter((c) => !c.done).map((c) => (
                <Link key={c.label} to={c.to} className="rounded border border-dashed bg-secondary px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground">
                  + {c.action}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Top matches */}
        <section className="rounded-lg border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" /> Top matches for you
            </h2>
            <Link to="/student/opportunities" className="flex items-center gap-1 text-sm text-accent hover:underline">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 divide-y">
            {ranked.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                No eligible roles yet — add skills to your profile to unlock matches.
              </p>
            )}
            {ranked.map(({ j, r }) => (
              <div key={j.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{j.title}</div>
                  <div className="text-sm text-muted-foreground">{j.company?.name} · {j.location} · ₹{j.ctc_lpa} LPA</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.matched.slice(0, 3).map((s) => (
                      <span key={s.id} className="rounded bg-success/10 px-1.5 py-0.5 text-[11px] text-success">{s.name}</span>
                    ))}
                    {r.missing.slice(0, 2).map((s) => (
                      <span key={s.id} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{s.name}</span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-2xl font-semibold text-accent">{r.score}%</div>
                  <div className="text-xs text-muted-foreground">match</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Readiness breakdown */}
        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Readiness
            </h2>
            <Link to="/student/insights" className="text-sm text-accent hover:underline">Details →</Link>
          </div>
          <div className="mt-1 mb-4">
            <div className="font-display text-4xl font-bold text-accent">{readiness}<span className="text-lg text-muted-foreground font-normal">/100</span></div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {readiness >= 80 ? "Placement ready" : readiness >= 60 ? "Good — keep improving" : "Needs improvement"}
            </div>
          </div>
          <div className="space-y-2.5">
            {m.readiness.parts.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="font-medium">{p.value}/{p.max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-accent transition-all"
                    style={{ width: `${(p.value / p.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {topGaps.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" /> Top skill gaps
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topGaps.map(([n, c]) => (
                  <span key={n} className="rounded border bg-secondary px-2 py-0.5 text-xs">
                    {n} <span className="text-muted-foreground">· {c} roles</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Upcoming interviews */}
        <section className="rounded-lg border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" /> Upcoming interviews
            </h2>
            <Link to="/student/applications" className="text-sm text-accent hover:underline">All applications →</Link>
          </div>
          <div className="mt-3 divide-y">
            {upcoming.length === 0 && (
              <p className="py-3 text-sm text-muted-foreground">
                No interviews scheduled yet. Keep applying to opportunities!
              </p>
            )}
            {upcoming.map((i) => (
              <div key={i.id} className="flex justify-between gap-4 py-3">
                <div>
                  <div className="font-medium text-sm">{i.job?.title} · {i.job?.company?.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{i.round} · {i.mode} · {i.location}</div>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <div className="font-medium">{new Date(i.scheduled_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</div>
                  <div className="text-xs text-muted-foreground">{new Date(i.scheduled_at).toLocaleTimeString(undefined, { timeStyle: "short" })}</div>
                </div>
              </div>
            ))}
          </div>
          {(apps.data?.length ?? 0) > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              {Object.entries(
                (apps.data ?? []).reduce<Record<string, number>>(
                  (a, x) => ({ ...a, [x.status]: (a[x.status] ?? 0) + 1 }),
                  {}
                )
              ).map(([s, c]) => (
                <span key={s} className={`rounded px-2 py-0.5 text-xs capitalize ${statusStyles[s] ?? "bg-secondary"}`}>
                  {s}: {c}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Notifications */}
        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notifications
              {unreadCount > 0 && (
                <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">{unreadCount}</span>
              )}
            </h2>
          </div>
          <div className="mt-3 space-y-2">
            {recentNotifs.length === 0 && (
              <p className="text-sm text-muted-foreground">You're all caught up.</p>
            )}
            {recentNotifs.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`group relative w-full rounded-md border p-2.5 text-left text-sm transition-colors ${
                  n.read ? "opacity-60" : "border-accent/40 bg-accent/5 hover:bg-accent/10"
                }`}
              >
                <div className="flex items-start gap-2">
                  {categoryIcon(n.category)}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>
                  </div>
                  {!n.read && (
                    <X
                      className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Upcoming placement drives */}
        <section className="rounded-lg border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent" /> Upcoming placement drives
            </h2>
            <Link to="/student/drives" className="text-sm text-accent hover:underline">View all →</Link>
          </div>
          <div className="mt-3 divide-y">
            {upcomingDrives.length === 0 && (
              <p className="py-3 text-sm text-muted-foreground">No upcoming placement drives scheduled.</p>
            )}
            {upcomingDrives.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <div className="font-medium text-sm">{d.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d.company.name} · {d.venue}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-medium">{new Date(d.drive_date).toLocaleDateString(undefined, { dateStyle: "medium" })}</div>
                  <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[11px] text-accent capitalize">{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-accent" /> Quick actions
          </h2>
          <div className="mt-3 space-y-2">
            {[
              { to: "/student/opportunities", label: "Browse all opportunities", icon: Briefcase },
              { to: "/student/applications", label: "Track my applications", icon: ClipboardList },
              { to: "/student/insights", label: "View skill insights", icon: TrendingUp },
              { to: "/student/drives", label: "See placement drives", icon: GraduationCap },
              { to: "/student/profile", label: "Edit my profile", icon: UserRound },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
