import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RecruiterApplicant {
  id: string;
  status: string;
  applied_at: string;
  resume_url: string | null;
  student: {
    id: string;
    full_name: string;
    branch: string | null;
    graduation_year: number | null;
    cgpa: number | null;
    backlogs: number | null;
    email: string;
  };
  interviews: Array<{
    id: string;
    scheduled_at: string;
    interview_type: string;
    meeting_link: string | null;
    feedback: string | null;
    status?: string;
  }>;
  offers: Array<{
    id: string;
    salary: number | null;
    salary_unit: string | null;
    status: string;
    joining_date?: string | null;
  }>;
}

export interface RecruiterJob {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  job_type: string;
  location: string;
  description: string;
  minimum_cgpa: number | null;
  required_skills: string | null;
  deadline: string | null;
  status: string;
  created_at: string;
  applications: RecruiterApplicant[];
}

export function parseRequiredSkills(value: string | null): string[] {
  return value
    ? value
        .split(/[,\n;]/)
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];
}

export const myCompanyQuery = queryOptions({
  queryKey: ["my-company"],
  queryFn: async () => {
    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr || !u?.user) {
      throw new Error("Please sign in with recruiter credentials.");
    }

    const { data, error } = await supabase
      .from("recruiters")
      .select("company_id")
      .eq("user_id", u.user.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load recruiter company: ${error.message}`);
    }
    if (!data?.company_id) return null;

    const { data: company, error: compErr } = await supabase
      .from("companies")
      .select("*")
      .eq("id", data.company_id)
      .maybeSingle();

    if (compErr) {
      throw new Error(`Failed to load company profile: ${compErr.message}`);
    }

    return company;
  },
});

export const companyJobsQuery = (companyId: string | undefined) =>
  queryOptions({
    queryKey: ["company-jobs", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<RecruiterJob[]> => {
      if (!companyId) throw new Error("Recruiter company assignment is unavailable.");
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Please sign in with recruiter credentials.");
      }

      const { data: opportunities, error } = await supabase
        .from("opportunities")
        .select(
          "id,company_id,company_name,title,job_type,location,description,required_skills,minimum_cgpa,deadline,created_at",
        )
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to load company opportunities from Supabase: ${error.message}`);
      }

      const opportunityIds = (opportunities ?? []).map(({ id }) => id);
      if (!opportunityIds.length) return [];

      const { data: applications, error: applicationsError } = await supabase
        .from("applications")
        .select("id,profile_id,opportunity_id,status,applied_at,resume_url")
        .in("opportunity_id", opportunityIds);
      if (applicationsError) {
        throw new Error(`Failed to load applicant records: ${applicationsError.message}`);
      }

      const applicationIds = (applications ?? []).map(({ id }) => id);
      const profileIds = [
        ...new Set(
          (applications ?? [])
            .map(({ profile_id }) => profile_id)
            .filter((id): id is string => id !== null),
        ),
      ];
      const [profilesResult, interviewsResult, offersResult] = await Promise.all([
        profileIds.length
          ? supabase
              .from("profiles")
              .select("id,full_name,email,branch,graduation_year")
              .in("id", profileIds)
          : Promise.resolve({ data: [], error: null }),
        applicationIds.length
          ? supabase
              .from("interviews")
              .select("id,application_id,scheduled_at,interview_type,meeting_link,status,feedback")
              .in("application_id", applicationIds)
          : Promise.resolve({ data: [], error: null }),
        applicationIds.length
          ? supabase
              .from("offers")
              .select("id,application_id,salary,salary_unit,status,joining_date")
              .in("application_id", applicationIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesResult.error) {
        throw new Error(`Failed to load applicant profiles: ${profilesResult.error.message}`);
      }
      if (interviewsResult.error) {
        throw new Error(`Failed to load scheduled interviews: ${interviewsResult.error.message}`);
      }
      if (offersResult.error) {
        throw new Error(`Failed to load applicant offers: ${offersResult.error.message}`);
      }

      const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
      const interviewsByApplication = new Map<string, RecruiterApplicant["interviews"]>();
      for (const interview of interviewsResult.data ?? []) {
        if (!interview.application_id) continue;
        const items = interviewsByApplication.get(interview.application_id) ?? [];
        items.push({
          id: interview.id,
          scheduled_at: interview.scheduled_at,
          status: interview.status ?? "scheduled",
          interview_type: interview.interview_type ?? "Interview",
          meeting_link: interview.meeting_link,
          feedback: interview.feedback,
        });
        interviewsByApplication.set(interview.application_id, items);
      }
      const offersByApplication = new Map<string, RecruiterApplicant["offers"]>();
      for (const offer of offersResult.data ?? []) {
        if (!offer.application_id) continue;
        const items = offersByApplication.get(offer.application_id) ?? [];
        items.push({
          id: offer.id,
          salary: offer.salary,
          salary_unit: offer.salary_unit ?? null,
          status: offer.status ?? "pending",
          joining_date: offer.joining_date,
        });
        offersByApplication.set(offer.application_id, items);
      }
      const applicantsByOpportunity = new Map<string, RecruiterApplicant[]>();
      for (const application of applications ?? []) {
        if (!application.profile_id || !application.opportunity_id) continue;
        const profile = profiles.get(application.profile_id);
        if (!profile) {
          // Profile not visible under current RLS — skip rather than aborting the whole list.
          continue;
        }
        const applicants = applicantsByOpportunity.get(application.opportunity_id) ?? [];
        applicants.push({
          id: application.id,
          status: application.status ?? "applied",
          applied_at: application.applied_at,
          resume_url: application.resume_url,
          student: {
            id: profile.id,
            full_name: profile.full_name ?? "Name unavailable",
            branch: profile.branch,
            graduation_year: profile.graduation_year,
            cgpa: null,
            backlogs: null,
            email: profile.email ?? "Email unavailable",
          },
          interviews: interviewsByApplication.get(application.id) ?? [],
          offers: offersByApplication.get(application.id) ?? [],
        });
        applicantsByOpportunity.set(application.opportunity_id, applicants);
      }

      const today = new Date().toISOString().slice(0, 10);
      return (opportunities ?? []).map((opportunity): RecruiterJob => ({
        ...opportunity,
        company_id: opportunity.company_id ?? companyId,
        company_name: opportunity.company_name ?? "Company unavailable",
        title: opportunity.title ?? "Untitled opportunity",
        job_type: opportunity.job_type ?? "Type not specified",
        location: opportunity.location ?? "Location not specified",
        description: opportunity.description ?? "",
        required_skills: opportunity.required_skills,
        status: opportunity.deadline && opportunity.deadline < today ? "closed" : "open",
        applications: applicantsByOpportunity.get(opportunity.id) ?? [],
      }));
    },
  });
