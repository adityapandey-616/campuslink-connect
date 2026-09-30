import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeMatch, computeReadiness } from "./campus";

async function fetchMe() {
    const { data: u } = await supabase.auth.getUser();
    const { data: student, error } = await supabase.from("students").select("*").eq("user_id", u.user!.id).single();
    if (error) throw error;
    const [skills, projects, certs, docs] = await Promise.all([
      supabase.from("student_skills").select("level, skill:skills(id,name,category)").eq("student_id", student.id),
      supabase.from("projects").select("*").eq("student_id", student.id).order("created_at"),
      supabase.from("certifications").select("*").eq("student_id", student.id).order("created_at"),
      supabase.from("documents").select("*").eq("student_id", student.id).order("created_at"),
    ]);
    const skillList = (skills.data ?? []).map((s) => ({ ...s.skill!, level: s.level }));
    const readiness = computeReadiness({
      cgpa: Number(student.cgpa),
      backlogs: student.backlogs,
      skills: skillList.length,
      projects: projects.data?.length ?? 0,
      certs: certs.data?.length ?? 0,
      verifiedDocs: (docs.data ?? []).filter((d) => d.status === "verified").length,
    });
    return { student, skills: skillList, projects: projects.data ?? [], certs: certs.data ?? [], docs: docs.data ?? [], readiness };
}
export const meQuery = queryOptions({ queryKey: ["me-student"], queryFn: fetchMe });

async function fetchJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*, company:companies(id,name,industry,location), job_skills(skill:skills(id,name))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((j) => ({ ...j, skills: j.job_skills.map((s: { skill: { id: string; name: string } | null }) => s.skill!).filter(Boolean) }));
}
export const jobsQuery = queryOptions({ queryKey: ["jobs"], queryFn: fetchJobs });

export type Me = Awaited<ReturnType<typeof fetchMe>>;
export type Job = Awaited<ReturnType<typeof fetchJobs>>[number];

export function matchFor(me: Me, job: Job) {
  return computeMatch(
    { studentSkillIds: new Set(me.skills.map((s) => s.id)), cgpa: Number(me.student.cgpa), backlogs: me.student.backlogs, branch: me.student.branch },
    job,
  );
}

export const myApplicationsQuery = queryOptions({
  queryKey: ["my-applications"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*, job:jobs(id,title,ctc_lpa,location, company:companies(name)), interviews(*), offers(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});
