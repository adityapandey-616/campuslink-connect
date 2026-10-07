import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowUpRight, Filter, GraduationCap, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { BRANCHES, computeMatch } from "@/lib/campus";
import { MOCK_ALL_STUDENTS } from "@/lib/mock-data";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";

export const Route = createFileRoute("/_authenticated/recruiter/discover")({
  component: Discover,
});

function Discover() {
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));
  const [jobId, setJobId] = useState("");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");
  const [minCgpa, setMinCgpa] = useState(0);
  const [onlyEligible, setOnlyEligible] = useState(true);

  const list = jobs.data ?? [];
  const job = list.find((item) => item.id === jobId) ?? list[0];
  const ranked = useMemo(() => {
    if (!job) return [];
    const jobSkills = (job.job_skills ?? []).map((entry) => entry.skill).filter((skill): skill is { id: string; name: string } => skill !== null && skill !== undefined);
    const jobLike = { min_cgpa: job.min_cgpa, max_backlogs: job.max_backlogs, eligible_branches: job.eligible_branches, skills: jobSkills };
    return MOCK_ALL_STUDENTS.map((student) => ({ student, result: computeMatch({ studentSkillIds: new Set(student.student_skills.map((entry) => entry.skill_id)), cgpa: Number(student.cgpa), backlogs: student.backlogs, branch: student.branch }, jobLike) }))
      .filter(({ student, result }) => {
        const matchesSearch = `${student.full_name} ${student.branch} ${student.email}`.toLowerCase().includes(search.trim().toLowerCase());
        const matchesBranch = branch === "all" || student.branch === branch;
        const matchesCgpa = Number(student.cgpa) >= minCgpa;
        const matchesEligibility = !onlyEligible || result.eligible;
        return matchesSearch && matchesBranch && matchesCgpa && matchesEligibility;
      })
      .sort((a, b) => b.result.score - a.result.score);
  }, [branch, job, minCgpa, onlyEligible, search]);

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;
  if (!list.length) return <Empty>Create a job before discovering candidates.</Empty>;

  return (
    <>
      <PageHeader title="Candidate discovery" subtitle="Search, filter, and evaluate students against the selected role." action={job ? <select value={job.id} onChange={(event) => setJobId(event.target.value)} className="h-9 rounded-md border bg-card px-3 text-sm">{list.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select> : null} />
      <div className="mb-5 rounded-lg border bg-card p-3">
        <div className="grid gap-3 md:grid-cols-[1fr_repeat(3,160px)]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search candidates" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidate or email" className="pl-9" /></div>
          <select value={branch} onChange={(event) => setBranch(event.target.value)} className="h-9 rounded-md border bg-card px-3 text-sm"><option value="all">All branches</option>{BRANCHES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <input type="number" value={minCgpa} min={0} max={10} step={0.1} onChange={(event) => setMinCgpa(Number(event.target.value))} className="h-9 rounded-md border bg-card px-3 text-sm" aria-label="Minimum CGPA" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyEligible} onChange={(event) => setOnlyEligible(event.target.checked)} /> Eligible only</label>
        </div>
      </div>
      {ranked.length === 0 ? <Empty><Filter className="mx-auto mb-3 h-8 w-8" />No candidates match the current filters.</Empty> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{ranked.map(({ student, result }) => (
        <article key={student.id} className="flex min-w-0 flex-col rounded-lg border bg-card p-4 transition-colors hover:border-accent/50">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><div className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-sm font-semibold text-accent">{student.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div className="min-w-0"><div className="truncate font-semibold">{student.full_name}</div><div className="text-xs text-muted-foreground">{student.branch} · CGPA {student.cgpa}</div></div></div></div><span className="rounded bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">{result.score}%</span></div>
          <div className="mt-4 flex flex-wrap gap-1">{result.matched.slice(0, 4).map((skill) => <span key={skill.id} className="rounded bg-success/10 px-2 py-1 text-xs text-success">{skill.name}</span>)}{result.missing.length > 0 && <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{result.missing.length} gap{result.missing.length === 1 ? "" : "s"}</span>}</div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><div className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{student.backlogs} backlog{student.backlogs === 1 ? "" : "s"}</div><div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Bengaluru</div></div>
          <div className="mt-4 rounded-md bg-secondary/50 p-3 text-sm"><div className="flex items-center gap-1 font-medium"><Star className="h-3.5 w-3.5 text-accent" />Why this matches</div><p className="mt-1 text-muted-foreground">{result.reasons.length ? result.reasons.join(" · ") : "This candidate meets the basic role requirements."}</p></div>
          <Link to="/recruiter/candidate/$candidateId" params={{ candidateId: student.id }} className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary"><span>View full profile</span><ArrowUpRight className="h-4 w-4" /></Link>
        </article>
      ))}</div>}
    </>
  );
}
