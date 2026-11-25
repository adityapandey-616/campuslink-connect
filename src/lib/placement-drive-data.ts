import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PlacementDrive = Database["public"]["Tables"]["placement_drives"]["Row"];
export type PlacementDriveStatus = PlacementDrive["status"];

const DRIVE_FIELDS =
  "id,company_id,title,description,drive_date,registration_deadline,location,minimum_cgpa,eligible_branches,status,created_at" as const;

export const adminPlacementDrivesQuery = queryOptions({
  queryKey: ["admin-placement-drives"],
  queryFn: async (): Promise<PlacementDrive[]> => {
    const { data, error } = await supabase
      .from("placement_drives")
      .select(DRIVE_FIELDS)
      .order("drive_date", { ascending: true });
    if (error) throw new Error(`Could not load placement drives: ${error.message}`);
    return data ?? [];
  },
});

export interface LiveStudentPlacementDrive extends PlacementDrive {
  company: { id: string; name: string } | null;
}

export const liveStudentPlacementDrivesQuery = queryOptions({
  queryKey: ["live-student-placement-drives"],
  queryFn: async (): Promise<LiveStudentPlacementDrive[]> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Please sign in to view placement drives.");
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("placement_drives")
      .select(DRIVE_FIELDS)
      .eq("status", "upcoming")
      .gte("drive_date", today)
      .order("drive_date", { ascending: true });
    if (error) throw new Error(`Could not load placement drives: ${error.message}`);

    const drives = data ?? [];
    if (!drives.length) return [];

    const companyIds = [...new Set(drives.map((drive) => drive.company_id))];
    const { data: companies, error: companiesError } = await supabase
      .from("company_directory")
      .select("id,name")
      .in("id", companyIds);
    if (companiesError) {
      throw new Error(`Could not load placement-drive companies: ${companiesError.message}`);
    }

    const companiesById = new Map((companies ?? []).map((company) => [company.id, company]));
    return drives.map((drive) => ({
      ...drive,
      company: companiesById.get(drive.company_id) ?? null,
    }));
  },
});
