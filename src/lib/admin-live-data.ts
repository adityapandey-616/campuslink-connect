import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminProfile {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  role: string;
  branch: string | null;
  graduation_year: number | null;
}

export interface AdminCompany {
  id: string;
  name: string;
  industry: string;
  location: string;
  website: string | null;
  description: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  tier: string | null;
  created_at: string;
}

export interface AdminOpportunity {
  id: string;
  company_id: string | null;
  company_name: string;
  title: string;
  job_type: string;
  location: string;
  description: string;
  required_skills: string | null;
  minimum_cgpa: number | null;
  deadline: string | null;
  created_at: string;
}

export interface AdminApplication {
  id: string;
  profile_id: string | null;
  opportunity_id: string | null;
  status: string;
  student_name: string;
  student_branch: string | null;
  opportunity_title: string;
  company_name: string;
}

export interface AdminInterview {
  id: string;
  application_id: string | null;
  scheduled_at: string;
  status: string;
  student_name: string;
  company_name: string;
  opportunity_title: string;
}

export interface AdminOffer {
  id: string;
  application_id: string | null;
  salary: number | null;
  status: string;
  joining_date: string | null;
  created_at: string;
  student_name: string;
  company_name: string;
  opportunity_title: string;
}

export interface AdminNotification {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminOverview {
  profiles: AdminProfile[];
  students: AdminProfile[];
  recruiters: AdminProfile[];
  companies: AdminCompany[];
  opportunities: AdminOpportunity[];
  applications: AdminApplication[];
  interviews: AdminInterview[];
  offers: AdminOffer[];
}

async function fetchPages<T>(
  relation: string,
  fetchPage: (
    from: number,
    to: number,
  ) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) {
      throw new Error(`Could not load admin ${relation}: ${error.message}`);
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function loadAdminProfiles(): Promise<AdminProfile[]> {
  const profiles = await fetchPages("profiles", async (from, to) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,created_at,full_name,email,role,branch,graduation_year")
      .order("created_at", { ascending: false })
      .range(from, to);
    return { data, error };
  });
  return profiles.map((profile) => ({
    ...profile,
    full_name: profile.full_name ?? "Name unavailable",
    email: profile.email ?? "",
    role: profile.role ?? "unassigned",
  }));
}

async function loadAdminCompanies(): Promise<AdminCompany[]> {
  const companies = await fetchPages("companies", async (from, to) => {
    const { data, error } = await supabase
      .from("companies")
      .select("id,name,industry,location,website,description,email,phone,status,tier,created_at")
      .order("created_at", { ascending: false })
      .range(from, to);
    return { data, error };
  });
  return companies.map((company) => ({
    ...company,
    industry: company.industry ?? "Industry not specified",
    location: company.location ?? "Location not specified",
    description: company.description ?? "",
    created_at: company.created_at ?? "",
  }));
}

async function loadAdminOpportunities(): Promise<AdminOpportunity[]> {
  const opportunities = await fetchPages("opportunities", async (from, to) => {
    const { data, error } = await supabase
      .from("opportunities")
      .select(
        "id,company_id,company_name,title,job_type,location,description,required_skills,minimum_cgpa,deadline,created_at",
      )
      .order("created_at", { ascending: false })
      .range(from, to);
    return { data, error };
  });
  return opportunities.map((opportunity) => ({
    ...opportunity,
    company_name: opportunity.company_name ?? "Company unavailable",
    title: opportunity.title ?? "Untitled opportunity",
    job_type: opportunity.job_type ?? "Type not specified",
    location: opportunity.location ?? "Location not specified",
    description: opportunity.description ?? "",
    created_at: opportunity.created_at ?? "",
  }));
}

async function loadAdminApplications() {
  return fetchPages(
    "applications",
    async (
      from,
      to,
    ): Promise<{
      data: Array<{
        id: string;
        profile_id: string | null;
        opportunity_id: string | null;
        status: string;
      }> | null;
      error: { message: string } | null;
    }> => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,profile_id,opportunity_id,status")
        .order("id", { ascending: true })
        .range(from, to);
      return {
        data:
          data?.map((application) => ({
            ...application,
            status: application.status ?? "unknown",
          })) ?? null,
        error,
      };
    },
  );
}

async function loadAdminInterviews() {
  return fetchPages(
    "interviews",
    async (
      from,
      to,
    ): Promise<{
      data: Array<{
        id: string;
        application_id: string | null;
        scheduled_at: string;
        status: string;
      }> | null;
      error: { message: string } | null;
    }> => {
      const { data, error } = await supabase
        .from("interviews")
        .select("id,application_id,scheduled_at,status")
        .order("scheduled_at", { ascending: true })
        .range(from, to);
      return {
        data:
          data?.map((interview) => ({
            ...interview,
            status: interview.status ?? "unknown",
          })) ?? null,
        error,
      };
    },
  );
}

async function loadAdminOffers() {
  return fetchPages(
    "offers",
    async (
      from,
      to,
    ): Promise<{
      data: Array<{
        id: string;
        application_id: string | null;
        salary: number | null;
        status: string;
        joining_date: string | null;
        created_at: string;
      }> | null;
      error: { message: string } | null;
    }> => {
      const { data, error } = await supabase
        .from("offers")
        .select("id,application_id,salary,status,joining_date,created_at")
        .order("created_at", { ascending: false })
        .range(from, to);
      return {
        data:
          data?.map((offer) => ({
            ...offer,
            status: offer.status ?? "unknown",
          })) ?? null,
        error,
      };
    },
  );
}

async function loadAdminNotifications(): Promise<AdminNotification[]> {
  const notifications = await fetchPages("notifications", async (from, to) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("id,profile_id,title,message,is_read,created_at")
      .order("created_at", { ascending: false })
      .range(from, to);
    return { data, error };
  });
  return notifications.map((notification) => ({
    ...notification,
    profile_id: notification.profile_id ?? "",
    title: notification.title ?? "Notification",
    message: notification.message ?? "",
    is_read: notification.is_read ?? false,
  }));
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [profiles, companies, opportunities, applicationRows, interviewRows, offerRows] =
    await Promise.all([
      loadAdminProfiles(),
      loadAdminCompanies(),
      loadAdminOpportunities(),
      loadAdminApplications(),
      loadAdminInterviews(),
      loadAdminOffers(),
    ]);

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const companiesById = new Map(companies.map((company) => [company.id, company]));
  const opportunitiesById = new Map(
    opportunities.map((opportunity) => [opportunity.id, opportunity]),
  );
  const applicationsById = new Map(
    applicationRows.map((application) => [application.id, application]),
  );

  const applications = applicationRows.map((application): AdminApplication => {
    const profile = profilesById.get(application.profile_id ?? "");
    const opportunity = opportunitiesById.get(application.opportunity_id ?? "");
    return {
      ...application,
      student_name: profile?.full_name ?? "Profile not visible",
      student_branch: profile?.branch ?? null,
      opportunity_title: opportunity?.title ?? "Opportunity not visible",
      company_name: companiesById.get(opportunity?.company_id ?? "")?.name ?? "Company not visible",
    };
  });

  const interviews = interviewRows.map((interview): AdminInterview => {
    const application = applicationsById.get(interview.application_id ?? "");
    const profile = profilesById.get(application?.profile_id ?? "");
    const opportunity = opportunitiesById.get(application?.opportunity_id ?? "");
    return {
      ...interview,
      student_name: profile?.full_name ?? "Profile not visible",
      company_name: companiesById.get(opportunity?.company_id ?? "")?.name ?? "Company not visible",
      opportunity_title: opportunity?.title ?? "Opportunity not visible",
    };
  });

  const offers = offerRows.map((offer): AdminOffer => {
    const application = applicationsById.get(offer.application_id ?? "");
    const profile = profilesById.get(application?.profile_id ?? "");
    const opportunity = opportunitiesById.get(application?.opportunity_id ?? "");
    return {
      ...offer,
      student_name: profile?.full_name ?? "Profile not visible",
      company_name: companiesById.get(opportunity?.company_id ?? "")?.name ?? "Company not visible",
      opportunity_title: opportunity?.title ?? "Opportunity not visible",
    };
  });

  return {
    profiles,
    students: profiles.filter((profile) => profile.role === "student"),
    recruiters: profiles.filter((profile) => profile.role === "recruiter"),
    companies,
    opportunities,
    applications,
    interviews,
    offers,
  };
}

export const adminProfilesQuery = queryOptions({
  queryKey: ["admin-profiles"],
  queryFn: loadAdminProfiles,
});

export const adminCompaniesQuery = queryOptions({
  queryKey: ["admin-companies"],
  queryFn: loadAdminCompanies,
});

export const adminOpportunitiesQuery = queryOptions({
  queryKey: ["admin-opportunities"],
  queryFn: loadAdminOpportunities,
});

export const adminNotificationsQuery = queryOptions({
  queryKey: ["admin-notifications"],
  queryFn: loadAdminNotifications,
});

export const adminOverviewQuery = queryOptions({
  queryKey: ["admin-overview"],
  queryFn: getAdminOverview,
});

export interface AdminRecruiter {
  user_id: string;
  company_id: string | null;
  full_name: string;
  email: string;
}

async function loadAdminRecruiters(): Promise<AdminRecruiter[]> {
  const [profilesRes, recruitersRes] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email").eq("role", "recruiter"),
    supabase.from("recruiters").select("user_id,company_id"),
  ]);

  if (profilesRes.error) {
    throw new Error(`Could not load recruiter profiles: ${profilesRes.error.message}`);
  }
  if (recruitersRes.error) {
    throw new Error(`Could not load recruiter assignments: ${recruitersRes.error.message}`);
  }

  const recruiterMap = new Map((recruitersRes.data ?? []).map((r) => [r.user_id, r]));
  const profiles = profilesRes.data ?? [];

  return profiles.map((p) => {
    const rec = recruiterMap.get(p.id);
    return {
      user_id: p.id,
      company_id: rec?.company_id ?? null,
      full_name: p.full_name || "Name unavailable",
      email: p.email ?? "",
    };
  });
}

export const adminRecruitersQuery = queryOptions({
  queryKey: ["admin-recruiters"],
  queryFn: loadAdminRecruiters,
});
