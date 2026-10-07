import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";
import { computeMatch } from "@/lib/campus";
import { MOCK_ALL_STUDENTS } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/recruiter/discover")({
  component: Discover,
});

function Discover() {
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));
  const students = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      try {
        const res = await supabase.from("students").select("id,full_name,branch,cgpa,backlogs,placement_status, student_skills(skill_id)");
        if (res.data && res.data.length > 0) return res.data;
        return MOCK_ALL_STUDENTS;
      } catch {
        return MOCK_ALL_STUDENTS;
      }
    },
  });
  const [jobId, setJobId] = useState("");

  if (company.isLoading || jobs.isLoading || students.isLoading) return <Loading />;
  const list = jobs.data ?? [];
  if (!list.length) return <Empty>Create a job first to discover matching candidates.</Empty>;
  const job = (list.find((j) => j.id === jobId) ?? list[0])!;
  const jobLike = { ...(job as unknown as { min_cgpa: number; max_backlogs: number; eligible_branches: string[] }), skills: (job.job_skills ?? []).map((s) => s.skill!).filter(Boolean) };
  const ranked = (students.data ?? [])
    .map((s) => ({ s, r: computeMatch({ studentSkillIds: new Set(s.student_skills.map((x) => x.skill_id)), cgpa: Number(s.cgpa), backlogs: s.backlogs, branch: s.branch }, jobLike) }))
    .filter((x) => x.r.eligible)
    .sort((a, b) => b.r.score - a.r.score);

  return (
    <>
      <PageHeader
        title="Candidate discovery"
        subtitle="Eligible students ranked by match for the selected role."
        action={<select value={job.id} onChange={(e) => setJobId(e.target.value)} className="h-9 rounded-md border bg-card px-3 text-sm">{list.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select>}
      />
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-3">Candidate</th><th className="p-3">Branch</th><th className="p-3">CGPA</th><th className="p-3">Matched skills</th><th className="p-3">Gaps</th><th className="p-3 text-right">Match</th></tr>
          </thead>
          <tbody className="divide-y">
            {ranked.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No eligible candidates for this role.</td></tr>}
            {ranked.map(({ s, r }) => (
              <tr key={s.id}>
                <td className="p-3 font-medium">{s.full_name}{s.placement_status === "placed" && <span className="ml-2 rounded bg-success/15 px-1.5 text-xs text-success">placed</span>}</td>
                <td className="p-3">{s.branch}</td>
                <td className="p-3">{s.cgpa}</td>
                <td className="p-3 text-muted-foreground">{r.matched.map((m) => m.name).join(", ") || "—"}</td>
                <td className="p-3 text-muted-foreground">{r.missing.map((m) => m.name).join(", ") || "—"}</td>
                <td className="p-3 text-right font-display font-semibold text-accent">{r.score}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
