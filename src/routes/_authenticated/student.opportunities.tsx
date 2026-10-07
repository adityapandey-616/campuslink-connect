import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Briefcase, Check, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { jobsQuery, matchFor, meQuery, myApplicationsQuery, type Job } from "@/lib/student-data";
import { addMockApplication, addMockNotification } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/student/opportunities")({
  component: Opportunities,
});

function Opportunities() {
  const me = useQuery(meQuery);
  const jobs = useQuery(jobsQuery);
  const apps = useQuery(myApplicationsQuery);
  const qc = useQueryClient();

  const [open, setOpen] = useState<Job | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const apply = useMutation({
    mutationFn: async ({ job, score }: { job: Job; score: number }) => {
      addMockApplication(job.id, score);
      addMockNotification({
        title: `Application Submitted — ${job.company?.name}`,
        body: `Your application for ${job.title} at ${job.company?.name} has been submitted successfully.`,
        category: "application",
      });
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      qc.invalidateQueries({ queryKey: ["mock-notifications"] });
      setOpen(null);
    },
    onError: () => {
      toast.error("Failed to submit application. Please try again.");
    },
  });

  const applied = new Set((apps.data ?? []).map((a) => a.job_id));
  const allJobs = jobs.data ?? [];

  // Unique filter options
  const jobTypes = [...new Set(allJobs.map((j) => j.job_type))];
  const locations = [...new Set(allJobs.map((j) => j.location))];

  const list = useMemo(() => {
    if (!me.data) return [];
    return allJobs
      .map((j) => ({ j, r: matchFor(me.data, j) }))
      .filter(({ j, r }) => {
        if (onlyEligible && !r.eligible) return false;
        if (filterType && j.job_type !== filterType) return false;
        if (filterLocation && j.location !== filterLocation) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            j.title.toLowerCase().includes(q) ||
            (j.company?.name ?? "").toLowerCase().includes(q) ||
            j.location.toLowerCase().includes(q) ||
            j.skills.some((s) => s.name.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => b.r.score - a.r.score);
  }, [allJobs, me.data, onlyEligible, filterType, filterLocation, search]);

  if (me.isLoading || jobs.isLoading) return <Loading />;
  if (!me.data) return <Empty>Couldn't load your profile.</Empty>;

  const sel = open ? matchFor(me.data, open) : null;
  const hasFilters = onlyEligible || filterType || filterLocation;
  const eligibleCount = allJobs.filter((j) => matchFor(me.data, j).eligible).length;

  return (
    <>
      <PageHeader
        title="Opportunities"
        subtitle={`${allJobs.length} open roles · ${eligibleCount} you're eligible for`}
      />

      {/* Search and filters */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles, companies, skills…"
              className="pl-9"
            />
          </div>
          <Button
            variant={hasFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="shrink-0 gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {hasFilters && <span className="rounded-full bg-accent-foreground/20 px-1.5 py-0.5 text-[10px]">
              {[onlyEligible, filterType, filterLocation].filter(Boolean).length}
            </span>}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyEligible}
                onChange={(e) => setOnlyEligible(e.target.checked)}
                className="rounded"
              />
              Eligible only
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-8 rounded-md border bg-card px-2 text-sm"
            >
              <option value="">All types</option>
              {jobTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="h-8 rounded-md border bg-card px-2 text-sm"
            >
              <option value="">All locations</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            {hasFilters && (
              <button
                onClick={() => { setOnlyEligible(false); setFilterType(""); setFilterLocation(""); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {(search || hasFilters) && (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {search && (
              <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                Search: "{search}"
                <button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            {onlyEligible && (
              <span className="flex items-center gap-1 rounded-full bg-accent/10 text-accent px-2.5 py-1">
                Eligible only <button onClick={() => setOnlyEligible(false)}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filterType && (
              <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                {filterType} <button onClick={() => setFilterType("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filterLocation && (
              <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                {filterLocation} <button onClick={() => setFilterLocation("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            <span className="text-muted-foreground self-center">{list.length} result{list.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Job cards */}
      <div className="grid gap-3">
        {list.length === 0 && (
          <Empty>
            <Briefcase className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <div className="font-medium">No roles match your current filters.</div>
            <div className="mt-1 text-muted-foreground">Try removing some filters or add more skills to your profile.</div>
          </Empty>
        )}
        {list.map(({ j, r }) => (
          <button
            key={j.id}
            onClick={() => setOpen(j)}
            className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-accent/50 hover:shadow-sm"
            aria-label={`Open details for ${j.title} at ${j.company?.name}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{j.title}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{j.job_type}</span>
                {applied.has(j.id) && (
                  <span className="flex items-center gap-0.5 rounded bg-accent/15 px-1.5 py-0.5 text-xs text-accent">
                    <Check className="h-3 w-3" /> Applied
                  </span>
                )}
                {!r.eligible && (
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">Not eligible</span>
                )}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {j.company?.name} · {j.location} · ₹{j.ctc_lpa} LPA · Deadline {j.deadline ?? "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Min CGPA {j.min_cgpa} · Max backlogs {j.max_backlogs} · {j.eligible_branches.join(", ")}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {j.skills.map((s) => (
                  <span
                    key={s.id}
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      r.matched.some((m) => m.id === s.id)
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className={`font-display text-2xl font-bold ${r.eligible ? "text-accent" : "text-muted-foreground"}`}>
                {r.score}%
              </div>
              <div className="text-xs text-muted-foreground">{r.eligible ? "match" : "not eligible"}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Job detail dialog */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {open && sel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{open.title}</DialogTitle>
                <div className="text-sm text-muted-foreground">{open.company?.name} · {open.location}</div>
              </DialogHeader>

              <p className="text-sm text-muted-foreground">{open.description}</p>

              {/* Job info grid */}
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <Info k="CTC" v={`₹${open.ctc_lpa} LPA`} />
                <Info k="Type" v={open.job_type} />
                <Info k="Location" v={open.location} />
                <Info k="Min CGPA" v={String(open.min_cgpa)} />
                <Info k="Max backlogs" v={String(open.max_backlogs)} />
                <Info k="Deadline" v={open.deadline ?? "—"} />
              </div>

              <div className="text-sm">
                <div className="font-medium mb-1">Eligible Branches</div>
                <div className="flex flex-wrap gap-1">
                  {open.eligible_branches.map((b) => (
                    <span key={b} className="rounded bg-secondary px-2 py-0.5 text-xs">{b}</span>
                  ))}
                </div>
              </div>

              {/* Required skills */}
              <div className="text-sm">
                <div className="font-medium mb-1.5">Required Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {open.skills.map((s) => (
                    <span
                      key={s.id}
                      className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
                        sel.matched.some((m) => m.id === s.id)
                          ? "bg-success/15 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {sel.matched.some((m) => m.id === s.id)
                        ? <Check className="h-3 w-3" />
                        : <X className="h-3 w-3" />
                      }
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Match reasons / blockers */}
              <div className="rounded-md bg-secondary/50 p-3 text-sm">
                <div className="font-semibold mb-2">Your match — {sel.score}%</div>
                <ul className="space-y-1">
                  {sel.reasons.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-success">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {x}
                    </li>
                  ))}
                  {sel.blockers.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-destructive">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {x}
                    </li>
                  ))}
                </ul>
              </div>

              {sel.missing.length > 0 && (
                <div className="text-sm">
                  <div className="font-semibold mb-1">Skill gaps to close</div>
                  <p className="text-muted-foreground">
                    Add{" "}
                    <strong>{sel.missing.map((m) => m.name).join(", ")}</strong>
                    {" "}to your profile to reach 100% skill coverage.
                  </p>
                </div>
              )}

              {/* Apply / status */}
              <div className="flex items-center gap-3 pt-2 border-t">
                <Button
                  className="flex-1"
                  disabled={!sel.eligible || applied.has(open.id) || apply.isPending}
                  onClick={() => apply.mutate({ job: open, score: sel.score })}
                >
                  {apply.isPending
                    ? "Submitting…"
                    : applied.has(open.id)
                    ? "✓ Application Submitted"
                    : !sel.eligible
                    ? "Not Eligible"
                    : "Apply Now"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-secondary p-2">
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}
