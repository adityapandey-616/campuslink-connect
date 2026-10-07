import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { computeReadiness } from "@/lib/campus";
import { MOCK_ALL_STUDENTS } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/attention")({
  component: Attention,
});

function Attention() {
  const q = useQuery({
    queryKey: ["attention"],
    queryFn: async () => {
      try {
        const res = await supabase.from("students").select("id,full_name,branch,cgpa,backlogs,placement_status, student_skills(skill_id), projects(id), certifications(id), documents(status), applications(id)");
        if (res.data && res.data.length > 0) return res.data;
        return MOCK_ALL_STUDENTS;
      } catch {
        return MOCK_ALL_STUDENTS;
      }
    },
  });
  if (q.isLoading) return <Loading />;
  const rows = (q.data ?? []).map((s) => {
    const r = computeReadiness({ cgpa: Number(s.cgpa), backlogs: s.backlogs, skills: s.student_skills.length, projects: s.projects.length, certs: s.certifications.length, verifiedDocs: s.documents.filter((d) => d.status === "verified").length });
    const issues: string[] = [];
    if (s.backlogs > 0) issues.push(`${s.backlogs} backlog(s)`);
    if (Number(s.cgpa) < 6.5) issues.push("CGPA below 6.5");
    if (s.student_skills.length < 4) issues.push("Few skills listed");
    if (s.applications.length === 0) issues.push("No applications");
    if (r.total < 60) issues.push("Low readiness");
    return { s, score: r.total, issues };
  }).filter((x) => x.s.placement_status !== "placed" && x.issues.length).sort((a, b) => a.score - b.score);

  return (
    <>
      <PageHeader
        title="Students requiring attention"
        subtitle="Unplaced students with risk factors, lowest readiness first."
        action={
          <div className="flex gap-2">
            <Link to="/admin/students">
              <Button size="sm" variant="outline">
                All Students Directory
              </Button>
            </Link>
          </div>
        }
      />
      {rows.length === 0 ? <Empty>No students need attention right now.</Empty> : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-3">Student</th><th className="p-3">Branch</th><th className="p-3">CGPA</th><th className="p-3">Readiness</th><th className="p-3">Issues</th></tr></thead>
            <tbody className="divide-y">
              {rows.map(({ s, score, issues }) => (
                <tr key={s.id}>
                  <td className="p-3 font-medium">{s.full_name}</td><td className="p-3">{s.branch}</td><td className="p-3">{s.cgpa}</td>
                  <td className={`p-3 font-semibold ${score < 50 ? "text-destructive" : "text-foreground"}`}>{score}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">{issues.map((i) => <span key={i} className="rounded bg-warning/20 px-1.5 py-0.5 text-xs">{i}</span>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
