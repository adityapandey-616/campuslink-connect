import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookOpen, CheckCircle2, ChevronRight, TrendingUp, XCircle } from "lucide-react";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { jobsQuery, matchFor, meQuery } from "@/lib/student-data";
import { MOCK_SKILLS } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/student/insights")({
  component: SkillInsights,
});

const RECOMMENDED_SKILLS = [
  { name: "Docker", reason: "Required in 6+ cloud & DevOps roles" },
  { name: "Kubernetes", reason: "High demand in infrastructure roles" },
  { name: "AWS", reason: "Cloud skills open 8+ more roles" },
  { name: "System Design", reason: "Required for senior software roles" },
  { name: "GraphQL", reason: "Modern API design for full-stack roles" },
];

function SkillInsights() {
  const me = useQuery(meQuery);
  const jobs = useQuery(jobsQuery);

  if (me.isLoading || jobs.isLoading) return <Loading />;
  if (!me.data) return <Empty>Couldn't load your profile.</Empty>;

  const m = me.data;
  const allJobs = jobs.data ?? [];

  const gaps = new Map<string, { count: number; roles: string[] }>();
  allJobs.forEach((j) => {
    const r = matchFor(m, j);
    r.missing.forEach((s) => {
      const existing = gaps.get(s.name) ?? { count: 0, roles: [] };
      gaps.set(s.name, { count: existing.count + 1, roles: [...existing.roles, j.title] });
    });
  });
  const topGaps = [...gaps.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);

  const strongSkills = m.skills.filter((s) => {
    const matchCount = allJobs.filter((j) => j.skills.some((js) => js.id === s.id)).length;
    return matchCount >= 2;
  });

  const eligibleCount = allJobs.filter((j) => matchFor(m, j).eligible).length;
  const nearEligible = allJobs
    .map((j) => ({ j, r: matchFor(m, j) }))
    .filter(({ r }) => !r.eligible && r.score >= 35)
    .sort((a, b) => b.r.score - a.r.score)
    .slice(0, 3);

  const readiness = m.readiness;

  const scoreColor = readiness.total >= 80 ? "text-success" : readiness.total >= 60 ? "text-warning" : "text-destructive";

  return (
    <>
      <PageHeader
        title="Skill Insights"
        subtitle="Understand your strengths, gaps, and how to improve your placement readiness."
        action={
          <Link
            to="/student/profile"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            Update Skills <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {/* Disclaimer */}
      <div className="mb-6 flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/5 p-3 text-sm text-muted-foreground">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <span>
          Your <strong>Readiness Score</strong> is an assessment indicator based on your profile data.
          It is <strong>not</strong> a guarantee of placement. Maintain consistent academic performance alongside skill development.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overall readiness */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" /> Overall Readiness
          </h2>
          <div className="mt-4 text-center">
            <div className={`font-display text-6xl font-bold ${scoreColor}`}>{readiness.total}</div>
            <div className="text-muted-foreground text-sm mt-1">out of 100</div>
            <div className="mt-2 text-sm font-medium">
              {readiness.total >= 80 ? "🟢 Placement Ready" : readiness.total >= 60 ? "🟡 Good Progress" : "🔴 Needs Improvement"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              You are eligible for {eligibleCount} of {allJobs.length} open roles.
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {readiness.parts.map((p) => {
              const pct = Math.round((p.value / p.max) * 100);
              return (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="font-medium">{p.value}/{p.max}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-success" : pct >= 50 ? "bg-accent" : "bg-warning"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Strong skills */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" /> Strong Skills
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Skills you have that match 2+ open roles.</p>
          <div className="mt-4 space-y-2">
            {strongSkills.length === 0 && (
              <p className="text-sm text-muted-foreground">Add more skills to see your strengths here.</p>
            )}
            {strongSkills.map((s) => {
              const matchCount = allJobs.filter((j) => j.skills.some((js) => js.id === s.id)).length;
              return (
                <div key={s.id} className="flex items-center justify-between rounded-md bg-success/5 border border-success/20 px-3 py-2">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-success">{matchCount} roles</span>
                </div>
              );
            })}
          </div>
          {m.skills.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">All your skills</div>
              <div className="flex flex-wrap gap-1.5">
                {m.skills.map((s) => (
                  <span key={s.id} className="rounded border bg-secondary px-2 py-0.5 text-xs">{s.name}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Skill gaps */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" /> Skill Gaps
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Skills required by open roles that you haven't added yet.</p>
          <div className="mt-4 space-y-2">
            {topGaps.length === 0 && (
              <p className="text-sm text-success">🎉 No skill gaps detected for open roles!</p>
            )}
            {topGaps.map(([name, { count }]) => (
              <div key={name} className="flex items-center justify-between rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-destructive">{count} role{count > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
          <Link
            to="/student/profile"
            className="mt-4 flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            Add missing skills → <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        {/* Recommended skills to learn */}
        <section className="rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" /> Recommended Skills to Learn
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on market demand in campus recruitment for {m.student.branch} graduates.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {RECOMMENDED_SKILLS.filter(
              (rs) => !m.skills.some((s) => s.name.toLowerCase() === rs.name.toLowerCase())
            ).map((rs) => (
              <div key={rs.name} className="rounded-md border bg-secondary/50 p-3">
                <div className="font-medium text-sm">{rs.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{rs.reason}</div>
              </div>
            ))}
            {RECOMMENDED_SKILLS.filter(
              (rs) => m.skills.some((s) => s.name.toLowerCase() === rs.name.toLowerCase())
            ).map((rs) => (
              <div key={rs.name} className="rounded-md border bg-success/5 border-success/30 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <div>
                  <div className="font-medium text-sm">{rs.name}</div>
                  <div className="text-xs text-success">Already in your profile</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Near-eligible roles */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Almost There</h2>
          <p className="mt-1 text-xs text-muted-foreground">Roles you're close to qualifying for.</p>
          <div className="mt-4 space-y-3">
            {nearEligible.length === 0 && (
              <p className="text-sm text-muted-foreground">Add more skills to see near-eligible roles.</p>
            )}
            {nearEligible.map(({ j, r }) => (
              <div key={j.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{j.title}</div>
                  <span className="text-sm font-semibold text-muted-foreground">{r.score}%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{j.company?.name}</div>
                {r.blockers.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {r.blockers.map((b) => (
                      <div key={b} className="flex items-center gap-1.5 text-xs text-destructive">
                        <XCircle className="h-3 w-3 shrink-0" /> {b}
                      </div>
                    ))}
                  </div>
                )}
                {r.missing.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.missing.slice(0, 3).map((s) => (
                      <span key={s.id} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">+ {s.name}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Available skills to add */}
        <section className="rounded-lg border bg-card p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">All Available Skills</h2>
            <Link to="/student/profile" className="text-sm text-accent hover:underline">Add skills →</Link>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Skills you can add from the platform catalogue.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {MOCK_SKILLS.map((s) => {
              const have = m.skills.some((ms) => ms.id === s.id);
              const inDemand = (gaps.get(s.name)?.count ?? 0) > 0;
              return (
                <span
                  key={s.id}
                  className={`rounded border px-2 py-0.5 text-xs ${
                    have
                      ? "bg-success/10 border-success/30 text-success"
                      : inDemand
                      ? "bg-warning/10 border-warning/30 text-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {have ? "✓ " : ""}{s.name}
                  {inDemand && !have ? " 🔥" : ""}
                </span>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-success/30 inline-block" /> Have it</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-warning/30 inline-block" /> 🔥 In demand</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-secondary inline-block" /> Not in your profile</span>
          </div>
        </section>
      </div>
    </>
  );
}
