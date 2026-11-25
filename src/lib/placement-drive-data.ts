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

export interface MyDriveRegistration {
  id: string;
  drive_id: string;
  registered_at: string;
}

export const myDriveRegistrationsQuery = (profileId: string) =>
  queryOptions({
    queryKey: ["my-drive-registrations", profileId],
    queryFn: async (): Promise<MyDriveRegistration[]> => {
      const { data, error } = await supabase
        .from("drive_registrations")
        .select("id,drive_id,registered_at")
        .eq("profile_id", profileId);
      if (error) throw new Error(`Could not load your drive registrations: ${error.message}`);
      return data ?? [];
    },
  });

export interface AdminDriveRegistration extends MyDriveRegistration {
  profile_id: string;
  student: {
    full_name: string | null;
    email: string | null;
    branch: string | null;
  } | null;
}

export const adminDriveRegistrationsQuery = queryOptions({
  queryKey: ["admin-drive-registrations"],
  queryFn: async (): Promise<AdminDriveRegistration[]> => {
    const { data, error } = await supabase
      .from("drive_registrations")
      .select("id,drive_id,profile_id,registered_at")
      .order("registered_at", { ascending: false });
    if (error) throw new Error(`Could not load drive registrations: ${error.message}`);

    const registrations = data ?? [];
    if (!registrations.length) return [];

    const profileIds = [...new Set(registrations.map((registration) => registration.profile_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,full_name,email,branch")
      .in("id", profileIds);
    if (profilesError) {
      throw new Error(`Could not load registered student details: ${profilesError.message}`);
    }

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return registrations.map((registration) => ({
      ...registration,
      student: profilesById.get(registration.profile_id) ?? null,
    }));
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

    const { data, error } = await supabase
      .from("placement_drives")
      .select(DRIVE_FIELDS)
      .order("drive_date", { ascending: false });
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
