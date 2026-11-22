import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentApplication {
  id: string;
  profile_id: string;
  opportunity_id: string | null;
  status: string | null;
  applied_at: string;
  resume_url: string | null;
  job: {
    id: string;
    title: string;
    location: string;
    company: { name: string } | null;
  } | null;
  interviews: Array<{
    id: string;
    application_id: string;
    scheduled_at: string;
    interview_type: string;
    meeting_link: string | null;
    feedback: string | null;
    status: string;
  }>;
  offers: Array<{
    id: string;
    application_id: string;
    salary: number | null;
    status: string;
    joining_date: string | null;
    created_at: string;
  }>;
}

export interface LiveStudentOpportunity {
  id: string;
  company_id: string | null;
  title: string;
  job_type: string;
  location: string;
  description: string;
  minimum_cgpa: number | null;
  required_skills: string | null;
  deadline: string | null;
  created_at: string;
  company: { id: string; name: string } | null;
}

export const myProfileQuery = queryOptions({
  queryKey: ["my-live-profile"],
  queryFn: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please sign in to continue.");

    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,email,role,branch,graduation_year")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (error) throw new Error(`Could not load your profile: ${error.message}`);
    if (!data || data.role !== "student") {
      throw new Error("A student profile is not available for this account.");
    }
    return data;
  },
});

export const liveStudentOpportunitiesQuery = queryOptions({
  queryKey: ["live-student-opportunities"],
  queryFn: async (): Promise<LiveStudentOpportunity[]> => {
    const { error: userError, data: userData } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please sign in to view opportunities.");

    const { data: opportunities, error } = await supabase
      .from("opportunities")
      .select(
        "id,company_id,title,job_type,location,description,minimum_cgpa,required_skills,deadline,created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Could not load live opportunities: ${error.message}`);

    const companyIds = [
      ...new Set(
        (opportunities ?? [])
          .map((item) => item.company_id)
          .filter((id): id is string => id !== null),
      ),
    ];
    const { data: companies, error: companiesError } = companyIds.length
      ? await supabase.from("company_directory").select("id,name").in("id", companyIds)
      : { data: [], error: null };
    if (companiesError)
      throw new Error(`Could not load opportunity companies: ${companiesError.message}`);

    const companiesById = new Map((companies ?? []).map((company) => [company.id, company]));
    return (opportunities ?? []).map((opportunity) => ({
      ...opportunity,
      title: opportunity.title ?? "Untitled opportunity",
      job_type: opportunity.job_type ?? "Type not specified",
      location: opportunity.location ?? "Location not specified",
      description: opportunity.description ?? "",
      company:
        opportunity.company_id === null
          ? null
          : (companiesById.get(opportunity.company_id) ?? null),
    }));
  },
});

export const myApplicationsQuery = queryOptions({
  queryKey: ["my-applications"],
  queryFn: async (): Promise<StudentApplication[]> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Please sign in to view your applications.");
    }

    const { data: applications, error } = await supabase
      .from("applications")
      .select("id,profile_id,opportunity_id,status,applied_at,resume_url")
      .eq("profile_id", userData.user.id);

    if (error) {
      throw new Error(`Failed to load applications from Supabase: ${error.message}`);
    }

    const applicationRows = applications ?? [];
    if (!applicationRows.length) return [];

    const opportunityIds = [
      ...new Set(
        applicationRows
          .map((application) => application.opportunity_id)
          .filter((id): id is string => id !== null),
      ),
    ];
    const applicationIds = applicationRows.map((application) => application.id);
    const [opportunitiesResult, interviewsResult, offersResult] = await Promise.all([
      supabase
        .from("opportunities")
        .select("id,title,location,company_id")
        .in("id", opportunityIds),
      supabase
        .from("interviews")
        .select("id,application_id,scheduled_at,interview_type,meeting_link,feedback,status")
        .in("application_id", applicationIds),
      supabase
        .from("offers")
        .select("id,application_id,salary,status,joining_date,created_at")
        .in("application_id", applicationIds),
    ]);

    if (opportunitiesResult.error) {
      throw new Error(`Failed to load applied opportunities: ${opportunitiesResult.error.message}`);
    }
    if (interviewsResult.error) {
      throw new Error(`Failed to load application interviews: ${interviewsResult.error.message}`);
    }
    if (offersResult.error) {
      throw new Error(`Failed to load application offers: ${offersResult.error.message}`);
    }

    const companyIds = [
      ...new Set(
        (opportunitiesResult.data ?? [])
          .map((item) => item.company_id)
          .filter((id): id is string => id !== null),
      ),
    ];
    const companiesResult = companyIds.length
      ? await supabase.from("company_directory").select("id,name").in("id", companyIds)
      : { data: [], error: null };
    if (companiesResult.error) {
      throw new Error(`Failed to load application companies: ${companiesResult.error.message}`);
    }

    const companiesById = new Map(
      (companiesResult.data ?? []).map((company) => [company.id, company]),
    );
    const opportunitiesById = new Map(
      (opportunitiesResult.data ?? []).map((opportunity) => [
        opportunity.id,
        {
          id: opportunity.id,
          title: opportunity.title ?? "Untitled opportunity",
          location: opportunity.location ?? "Location not specified",
          company:
            opportunity.company_id === null
              ? null
              : (companiesById.get(opportunity.company_id) ?? null),
        },
      ]),
    );
    const interviewsByApplication = new Map<string, StudentApplication["interviews"]>();
    for (const interview of interviewsResult.data ?? []) {
      if (!interview.application_id) continue;
      const current = interviewsByApplication.get(interview.application_id) ?? [];
      current.push({
        ...interview,
        application_id: interview.application_id,
        interview_type: interview.interview_type ?? "Interview",
        status: interview.status ?? "scheduled",
      });
      interviewsByApplication.set(interview.application_id, current);
    }
    const offersByApplication = new Map<string, StudentApplication["offers"]>();
    for (const offer of offersResult.data ?? []) {
      if (!offer.application_id) continue;
      const current = offersByApplication.get(offer.application_id) ?? [];
      current.push({
        ...offer,
        application_id: offer.application_id,
        status: offer.status ?? "pending",
      });
      offersByApplication.set(offer.application_id, current);
    }

    return applicationRows.map((application) => ({
      ...application,
      profile_id: application.profile_id ?? userData.user.id,
      status: application.status ?? "applied",
      job: application.opportunity_id
        ? (opportunitiesById.get(application.opportunity_id) ?? null)
        : null,
      interviews: interviewsByApplication.get(application.id) ?? [],
      offers: offersByApplication.get(application.id) ?? [],
    }));
  },
});

export const myNotificationsQuery = queryOptions({
  queryKey: ["student-notifications"],
  queryFn: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Please sign in to view your notifications.");
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id,profile_id,title,message,is_read,created_at")
      .eq("profile_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load notifications from Supabase: ${error.message}`);
    }

    return data ?? [];
  },
});
