export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string;
          id: string;
          opportunity_id: string | null;
          profile_id: string | null;
          resume_url: string | null;
          status: string | null;
        };
        Insert: {
          applied_at?: string;
          id?: string;
          opportunity_id?: string | null;
          profile_id?: string | null;
          resume_url?: string | null;
          status?: string | null;
        };
        Update: {
          applied_at?: string;
          id?: string;
          opportunity_id?: string | null;
          profile_id?: string | null;
          resume_url?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor: string | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
        };
        Insert: {
          action: string;
          actor?: string | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          actor?: string | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      certifications: {
        Row: {
          created_at: string;
          id: string;
          issued_on: string | null;
          issuer: string;
          name: string;
          student_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          issued_on?: string | null;
          issuer?: string;
          name: string;
          student_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          issued_on?: string | null;
          issuer?: string;
          name?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certifications_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          created_at: string | null;
          description: string | null;
          email: string | null;
          id: string;
          industry: string | null;
          location: string | null;
          name: string;
          phone: string | null;
          status: string | null;
          tier: string | null;
          website: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          industry?: string | null;
          location?: string | null;
          name: string;
          phone?: string | null;
          status?: string | null;
          tier?: string | null;
          website?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          industry?: string | null;
          location?: string | null;
          name?: string;
          phone?: string | null;
          status?: string | null;
          tier?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          created_at: string;
          document_type: string | null;
          file_name: string | null;
          file_url: string | null;
          id: string;
          profile_id: string | null;
        };
        Insert: {
          created_at?: string;
          document_type?: string | null;
          file_name?: string | null;
          file_url?: string | null;
          id?: string;
          profile_id?: string | null;
        };
        Update: {
          created_at?: string;
          document_type?: string | null;
          file_name?: string | null;
          file_url?: string | null;
          id?: string;
          profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      drive_registrations: {
        Row: {
          drive_id: string;
          id: string;
          profile_id: string;
          registered_at: string;
        };
        Insert: {
          drive_id: string;
          id?: string;
          profile_id: string;
          registered_at?: string;
        };
        Update: {
          drive_id?: string;
          id?: string;
          profile_id?: string;
          registered_at?: string;
        };
        Relationships: [];
      };
      interviews: {
        Row: {
          application_id: string | null;
          feedback: string | null;
          id: string;
          interview_type: string | null;
          meeting_link: string | null;
          scheduled_at: string;
          status: string | null;
        };
        Insert: {
          application_id?: string | null;
          feedback?: string | null;
          id?: string;
          interview_type?: string | null;
          meeting_link?: string | null;
          scheduled_at?: string;
          status?: string | null;
        };
        Update: {
          application_id?: string | null;
          feedback?: string | null;
          id?: string;
          interview_type?: string | null;
          meeting_link?: string | null;
          scheduled_at?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      job_skills: {
        Row: {
          job_id: string;
          skill_id: string;
        };
        Insert: {
          job_id: string;
          skill_id: string;
        };
        Update: {
          job_id?: string;
          skill_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          ctc_lpa: number;
          deadline: string | null;
          description: string;
          eligible_branches: string[];
          id: string;
          job_type: string;
          location: string;
          max_backlogs: number;
          min_cgpa: number;
          status: string;
          title: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          ctc_lpa?: number;
          deadline?: string | null;
          description?: string;
          eligible_branches?: string[];
          id?: string;
          job_type?: string;
          location?: string;
          max_backlogs?: number;
          min_cgpa?: number;
          status?: string;
          title: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          ctc_lpa?: number;
          deadline?: string | null;
          description?: string;
          eligible_branches?: string[];
          id?: string;
          job_type?: string;
          location?: string;
          max_backlogs?: number;
          min_cgpa?: number;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunities: {
        Row: {
          company_id: string | null;
          company_name: string | null;
          created_at: string;
          deadline: string | null;
          description: string | null;
          id: string;
          job_type: string | null;
          location: string | null;
          minimum_cgpa: number | null;
          required_skills: string | null;
          title: string | null;
        };
        Insert: {
          company_id?: string | null;
          company_name?: string | null;
          created_at?: string;
          deadline?: string | null;
          description?: string | null;
          id?: string;
          job_type?: string | null;
          location?: string | null;
          minimum_cgpa?: number | null;
          required_skills?: string | null;
          title?: string | null;
        };
        Update: {
          company_id?: string | null;
          company_name?: string | null;
          created_at?: string;
          deadline?: string | null;
          description?: string | null;
          id?: string;
          job_type?: string | null;
          location?: string | null;
          minimum_cgpa?: number | null;
          required_skills?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean | null;
          message: string | null;
          profile_id: string | null;
          title: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          message?: string | null;
          profile_id?: string | null;
          title?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          message?: string | null;
          profile_id?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          application_id: string | null;
          created_at: string;
          id: string;
          joining_date: string | null;
          salary: number | null;
          salary_unit: string | null;
          status: string | null;
        };
        Insert: {
          application_id?: string | null;
          created_at?: string;
          id?: string;
          joining_date?: string | null;
          salary?: number | null;
          salary_unit?: string | null;
          status?: string | null;
        };
        Update: {
          application_id?: string | null;
          created_at?: string;
          id?: string;
          joining_date?: string | null;
          salary?: number | null;
          salary_unit?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      placement_drives: {
        Row: {
          company_id: string;
          created_at: string;
          description: string | null;
          drive_date: string;
          eligible_branches: string | null;
          id: string;
          location: string;
          minimum_cgpa: number | null;
          registration_deadline: string;
          status: "upcoming" | "ongoing" | "completed" | "cancelled";
          title: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          description?: string | null;
          drive_date: string;
          eligible_branches?: string | null;
          id?: string;
          location: string;
          minimum_cgpa?: number | null;
          registration_deadline: string;
          status?: "upcoming" | "ongoing" | "completed" | "cancelled";
          title: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          description?: string | null;
          drive_date?: string;
          eligible_branches?: string | null;
          id?: string;
          location?: string;
          minimum_cgpa?: number | null;
          registration_deadline?: string;
          status?: "upcoming" | "ongoing" | "completed" | "cancelled";
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "placement_drives_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          branch: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          graduation_year: number | null;
          id: string;
          role: string | null;
        };
        Insert: {
          branch?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          graduation_year?: number | null;
          id: string;
          role?: string | null;
        };
        Update: {
          branch?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          graduation_year?: number | null;
          id?: string;
          role?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          student_id: string;
          tech: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          student_id: string;
          tech?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          student_id?: string;
          tech?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      recruiters: {
        Row: {
          company_id: string;
          created_at: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recruiters_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recruiters_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      skills: {
        Row: {
          created_at: string;
          id: string;
          proficiency: string | null;
          profile_id: string | null;
          skill_name: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          proficiency?: string | null;
          profile_id?: string | null;
          skill_name?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          proficiency?: string | null;
          profile_id?: string | null;
          skill_name?: string | null;
        };
        Relationships: [];
      };
      student_skills: {
        Row: {
          level: number;
          skill_id: string;
          student_id: string;
        };
        Insert: {
          level?: number;
          skill_id: string;
          student_id: string;
        };
        Update: {
          level?: number;
          skill_id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_skills_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          backlogs: number;
          batch_year: number;
          bio: string;
          branch: string;
          cgpa: number;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          phone: string | null;
          placement_status: string;
          roll_no: string | null;
          tenth_pct: number | null;
          twelfth_pct: number | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          backlogs?: number;
          batch_year?: number;
          bio?: string;
          branch?: string;
          cgpa?: number;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          phone?: string | null;
          placement_status?: string;
          roll_no?: string | null;
          tenth_pct?: number | null;
          twelfth_pct?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          backlogs?: number;
          batch_year?: number;
          bio?: string;
          branch?: string;
          cgpa?: number;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          placement_status?: string;
          roll_no?: string | null;
          tenth_pct?: number | null;
          twelfth_pct?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      company_directory: {
        Row: {
          description: string | null;
          id: string;
          industry: string | null;
          location: string | null;
          name: string;
          website: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      app_manageable: { Args: { _app: string }; Returns: boolean };
      app_visible: { Args: { _app: string }; Returns: boolean };
      can_manage_job: { Args: { _job: string }; Returns: boolean };
      current_student_id: { Args: never; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      recruiter_company: { Args: { _uid: string }; Returns: string };
    };
    Enums: {
      app_role: "student" | "recruiter" | "admin";
      application_status:
        "applied" | "shortlisted" | "interview" | "offered" | "rejected" | "joined";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "recruiter", "admin"],
      application_status: ["applied", "shortlisted", "interview", "offered", "rejected", "joined"],
    },
  },
} as const;
