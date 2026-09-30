import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Briefcase, CalendarClock, FileCheck2, GraduationCap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CAMPUSLINK — AI-Powered Campus Placement Platform" },
      { name: "description", content: "Connect students, recruiters and placement teams with AI matching, skill-gap analysis, drives, interviews and placement analytics." },
      { property: "og:title", content: "CAMPUSLINK — Campus-to-Corporate Placement Platform" },
      { property: "og:description", content: "AI matching, readiness scores, placement drives and analytics in one place." },
    ],
  }),
  component: Landing,
});

const flow = ["Student Profile", "Readiness Analysis", "Job Matching", "Placement Drive", "Application", "Shortlisting", "Interviews", "Offers", "Joining", "Analytics"];

const features = [
  { icon: Target, title: "Readiness & skill-gap analysis", body: "Every student sees a readiness score built from academics, skills, projects and documents — and exactly which skills close the gap." },
  { icon: Briefcase, title: "Explainable job matching", body: "Match scores show why a student fits a role and what blocks eligibility, so nobody applies blind." },
  { icon: GraduationCap, title: "Candidate discovery", body: "Recruiters rank eligible candidates by match, shortlist in one click and move them through the pipeline." },
  { icon: CalendarClock, title: "Drives & interview scheduling", body: "Placement drives, interview rounds and notifications stay in sync for every party." },
  { icon: FileCheck2, title: "Offer & document tracking", body: "Offer letters, acceptances and verified documents tracked through to joining." },
  { icon: BarChart3, title: "Placement analytics", body: "Branch-wise placement rate, package trends and students needing attention for the placement cell." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Placement season, organised
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] text-foreground md:text-6xl">
            Connecting Campus Talent With Corporate Opportunities.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            One platform for students, recruiters and the placement cell — from profile and readiness to offer, joining and analytics.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Create student account <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth" search={{ mode: "signup", role: "recruiter" }}>I'm a recruiter</Link></Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Readiness snapshot</div>
            <div className="text-xs text-muted-foreground">Batch 2025 · CSE</div>
          </div>
          <div className="mt-4 flex items-end gap-4">
            <div className="font-display text-5xl font-bold">78</div>
            <div className="pb-2 text-sm text-muted-foreground">/ 100 readiness</div>
          </div>
          <div className="mt-4 space-y-3">
            {[["Backend Engineer · Finloop", 86], ["Software Engineer · Novatek", 74], ["Data Analyst · Quantiva", 61]].map(([t, v]) => (
              <div key={t as string}>
                <div className="flex justify-between text-sm"><span>{t}</span><span className="font-medium">{v}%</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${v}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md bg-secondary p-3 text-sm">
            <span className="font-medium">Skill gap:</span> <span className="text-muted-foreground">System Design, Node.js</span>
          </div>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">The placement workflow</div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {flow.map((f, i) => (
              <div key={f} className="flex items-center gap-2">
                <span className="rounded-md border bg-background px-3 py-1.5 text-sm">{f}</span>
                {i < flow.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold">Built for all three sides of placement</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-card p-6">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-xl bg-primary px-8 py-10 text-primary-foreground">
          <div>
            <h2 className="text-2xl font-semibold">Ready for this placement season?</h2>
            <p className="mt-1 text-primary-foreground/70">Set up your profile in minutes and see where you stand.</p>
          </div>
          <Button asChild size="lg" variant="secondary"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
        </div>
      </section>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">© 2026 CAMPUSLINK · Campus-to-Corporate Placement Platform</footer>
    </div>
  );
}
