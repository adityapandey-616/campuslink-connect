import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MOCK_COMPANIES,
  MOCK_ALL_STUDENTS,
  getCompanyById,
  getMockJobs,
  getMockApplications,
  getMockStudent,
} from "./mock-data";

export interface RecruiterApplicant {
  id: string;
  status: string;
  match_score: number;
  created_at: string;
  student: {
    id: string;
    full_name: string;
    branch: string;
    cgpa: number;
    backlogs: number;
    email: string;
  };
  interviews: Array<{
    id: string;
    round: string;
    scheduled_at: string;
    mode: string;
    location: string;
  }>;
  offers: Array<{
    id: string;
    ctc_lpa: number;
    status: string;
    joining_date?: string | null;
  }>;
}

export interface RecruiterJob {
  id: string;
  company_id: string;
  title: string;
  job_type: string;
  location: string;
  ctc_lpa: number;
  description: string;
  min_cgpa: number;
  max_backlogs: number;
  eligible_branches: string[];
  deadline: string | null;
  status: string;
  job_skills: Array<{ skill: { id: string; name: string } | null }>;
  applications: RecruiterApplicant[];
}

export const myCompanyQuery = queryOptions({
  queryKey: ["my-company"],
  queryFn: async () => {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) throw new Error("No user");
      const { data } = await supabase.from("recruiters").select("company_id, company:companies(*)").eq("user_id", u.user.id).maybeSingle();
      return (data as any)?.company ?? getCompanyById("c1");
    } catch {
      return getCompanyById("c1");
    }
  },
});

export const companyJobsQuery = (companyId: string | undefined) =>
  queryOptions({
    queryKey: ["company-jobs", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<RecruiterJob[]> => {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*, job_skills(skill:skills(id,name)), applications(*, student:students(id,full_name,branch,cgpa,backlogs,email), interviews(*), offers(*))")
          .eq("company_id", companyId!)
          .order("created_at", { ascending: false });
        if (error || !data || data.length === 0) throw error || new Error("No data");
        return data as unknown as RecruiterJob[];
      } catch {
        const allJobs = getMockJobs();
        const activeCompId = companyId ?? "c1";
        const matchingJobs = allJobs.filter((j) => !companyId || j.company_id === activeCompId || j.company_id === "c1");
        const mockApps = getMockApplications();
        const student = getMockStudent();

        return matchingJobs.map((j): RecruiterJob => {
          // Find any dynamic applications for this job from student
          const dynamicApps = mockApps
            .filter((a) => a.job_id === j.id)
            .map((a): RecruiterApplicant => ({
              id: a.id,
              status: a.status,
              match_score: a.match_score,
              created_at: a.created_at,
              student: {
                id: student.id,
                full_name: student.full_name,
                branch: student.branch,
                cgpa: Number(student.cgpa),
                backlogs: student.backlogs,
                email: student.email,
              },
              interviews: a.interviews.map((i) => ({
                id: i.id,
                round: i.round,
                scheduled_at: i.scheduled_at,
                mode: i.mode,
                location: i.location,
              })),
              offers: a.offers.map((o) => ({
                id: o.id,
                ctc_lpa: o.ctc_lpa,
                status: o.status,
                joining_date: o.joining_date,
              })),
            }));

          // Baseline mock candidates for richer demonstration
          const candidate1 = MOCK_ALL_STUDENTS[7] ?? MOCK_ALL_STUDENTS[0]!;
          const candidate2 = MOCK_ALL_STUDENTS[1] ?? MOCK_ALL_STUDENTS[0]!;

          const defaultApps: RecruiterApplicant[] = [
            {
              id: `app-demo-1-${j.id}`,
              status: "shortlisted",
              match_score: 79,
              created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
              student: {
                id: candidate1.id,
                full_name: candidate1.full_name,
                branch: candidate1.branch,
                cgpa: Number(candidate1.cgpa),
                backlogs: candidate1.backlogs,
                email: candidate1.email,
              },
              interviews: [],
              offers: [],
            },
            {
              id: `app-demo-2-${j.id}`,
              status: "offered",
              match_score: 92,
              created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
              student: {
                id: candidate2.id,
                full_name: candidate2.full_name,
                branch: candidate2.branch,
                cgpa: Number(candidate2.cgpa),
                backlogs: candidate2.backlogs,
                email: candidate2.email,
              },
              interviews: [{ id: `i-seed-${j.id}`, round: "Final HR", scheduled_at: new Date(Date.now() - 2 * 86400000).toISOString(), mode: "Online", location: "Zoom" }],
              offers: [{ id: `o-seed-${j.id}`, ctc_lpa: Number(j.ctc_lpa), status: "released" }],
            },
          ];

          const combinedApps = [...dynamicApps, ...defaultApps.filter((d) => !dynamicApps.some((da) => da.id === d.id))];

          return {
            id: j.id,
            company_id: j.company_id,
            title: j.title,
            job_type: j.job_type,
            location: j.location,
            ctc_lpa: j.ctc_lpa,
            description: j.description,
            min_cgpa: j.min_cgpa,
            max_backlogs: j.max_backlogs,
            eligible_branches: j.eligible_branches,
            deadline: j.deadline,
            status: j.status,
            job_skills: j.skills.map((s) => ({ skill: s })),
            applications: combinedApps,
          };
        });
      }
    },
  });
