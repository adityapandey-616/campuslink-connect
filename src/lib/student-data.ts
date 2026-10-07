import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeMatch, computeReadiness } from "./campus";
import {
  getMockStudent,
  getMockStudentSkills,
  getMockProjects,
  getMockCertifications,
  getMockDocuments,
  getMockJobs,
  getMockApplications,
  type MockApplication,
  MOCK_STUDENT,
  MOCK_STUDENT_SKILLS,
  MOCK_PROJECTS,
  MOCK_CERTS,
  MOCK_DOCUMENTS,
  MOCK_JOBS,
  MOCK_APPLICATIONS,
} from "./mock-data";

const SUPABASE_QUERY_TIMEOUT_MS = 5000;

interface StudentRecord {
  id: string;
  user_id: string;
  full_name: string;
  roll_no: string;
  branch: string;
  batch_year: number;
  cgpa: number | string;
  backlogs: number;
  phone: string;
  bio: string;
  placement_status: string;
}

interface StudentProfileData {
  student: StudentRecord;
  skills: Array<{ id: string; name: string; category: string; level: number }>;
  projects: ReturnType<typeof getMockProjects>;
  certs: ReturnType<typeof getMockCertifications>;
  docs: ReturnType<typeof getMockDocuments>;
  readiness: ReturnType<typeof computeReadiness>;
}

async function withSupabaseFallback<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Supabase request timed out.")), SUPABASE_QUERY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([query(), timeout]);
  } catch {
    return fallback;
  }
}

async function fetchMe(): Promise<StudentProfileData> {
  const student = getMockStudent();
  const skills = getMockStudentSkills();
  const projects = getMockProjects();
  const certs = getMockCertifications();
  const docs = getMockDocuments();
  const fallback = {
    student,
    skills,
    projects,
    certs,
    docs,
    readiness: computeReadiness({
      cgpa: Number(student.cgpa),
      backlogs: student.backlogs,
      skills: skills.length,
      projects: projects.length,
      certs: certs.length,
      verifiedDocs: docs.filter((d) => d.status === "verified").length,
    }),
  };

  return withSupabaseFallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) throw new Error("No user");
    const { data: studentData, error } = await supabase.from("students").select("*").eq("user_id", u.user.id).single();
    if (error || !studentData) throw error || new Error("No student");
    const [skillsData, projectsData, certsData, docsData] = await Promise.all([
      supabase.from("student_skills").select("level, skill:skills(id,name,category)").eq("student_id", studentData.id),
      supabase.from("projects").select("*").eq("student_id", studentData.id).order("created_at"),
      supabase.from("certifications").select("*").eq("student_id", studentData.id).order("created_at"),
      supabase.from("documents").select("*").eq("student_id", studentData.id).order("created_at"),
    ]);
    const skillList = (skillsData.data ?? []).map((s) => ({ ...s.skill!, level: s.level }));
    const readiness = computeReadiness({
      cgpa: Number(studentData.cgpa),
      backlogs: studentData.backlogs,
      skills: skillList.length,
      projects: projectsData.data?.length ?? 0,
      certs: certsData.data?.length ?? 0,
      verifiedDocs: (docsData.data ?? []).filter((d) => d.status === "verified").length,
    });
    return {
      student: studentData as StudentRecord,
      skills: skillList,
      projects: (projectsData.data ?? []) as StudentProfileData["projects"],
      certs: (certsData.data ?? []) as StudentProfileData["certs"],
      docs: (docsData.data ?? []) as StudentProfileData["docs"],
      readiness,
    };
  }, fallback);
}
export const meQuery = queryOptions({ queryKey: ["me-student"], queryFn: fetchMe });

export type Job = ReturnType<typeof getMockJobs>[number];

async function fetchJobs(): Promise<Job[]> {
  return withSupabaseFallback(async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*, company:companies(id,name,industry,location), job_skills(skill:skills(id,name))")
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) throw error || new Error("No jobs");
    return data.map((j) => ({
      ...j,
      skills: j.job_skills
        .map((s) => s.skill)
        .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill)),
    })) as Job[];
  }, getMockJobs());
}
export const jobsQuery = queryOptions({ queryKey: ["jobs"], queryFn: fetchJobs });

export type Me = Awaited<ReturnType<typeof fetchMe>>;

export function matchFor(me: Me, job: Job) {
  return computeMatch(
    { studentSkillIds: new Set(me.skills.map((s) => s.id)), cgpa: Number(me.student.cgpa), backlogs: me.student.backlogs, branch: me.student.branch },
    job,
  );
}

interface SupabaseApplication {
  id: string;
  student_id: string;
  job_id: string;
  status: "applied" | "shortlisted" | "interview" | "offered" | "rejected" | "joined";
  match_score: number;
  created_at: string;
  updated_at: string;
  job: {
    id: string;
    title: string;
    ctc_lpa: number;
    location: string;
    company: { name: string };
  };
  interviews: Array<{
    id: string;
    scheduled_at: string;
    round: string;
    mode: string;
    location: string;
    status: string;
  }>;
  offers: Array<{
    id: string;
    ctc_lpa: number;
    joining_date: string | null;
    status: string;
  }>;
}

export const myApplicationsQuery = queryOptions({
  queryKey: ["my-applications"],
  queryFn: async (): Promise<MockApplication[]> => withSupabaseFallback(async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*, job:jobs(id,title,ctc_lpa,location, company:companies(name)), interviews(*), offers(*)")
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) throw error || new Error("No apps");
    return data as unknown as MockApplication[];
  }, getMockApplications()),
});
