import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const myCompanyQuery = queryOptions({
  queryKey: ["my-company"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.from("recruiters").select("company_id, company:companies(*)").eq("user_id", u.user!.id).maybeSingle();
    return data?.company ?? null;
  },
});

export const companyJobsQuery = (companyId: string | undefined) =>
  queryOptions({
    queryKey: ["company-jobs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, job_skills(skill:skills(id,name)), applications(*, student:students(id,full_name,branch,cgpa,backlogs,email), interviews(*), offers(*))")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
