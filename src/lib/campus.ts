import { supabase } from "@/integrations/supabase/client";

export type Role = "student" | "recruiter" | "admin";

export function getActiveRole(): Role {
  if (typeof window !== "undefined") {
    const r = localStorage.getItem("campuslink_active_role") as Role;
    if (r === "student" || r === "recruiter" || r === "admin") return r;
  }
  return "student";
}

export function setActiveRole(role: Role) {
  if (typeof window !== "undefined") {
    localStorage.setItem("campuslink_active_role", role);
  }
}

export async function getMyRoles(): Promise<Role[]> {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return ["student", "recruiter", "admin"];
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const roles = (data ?? []).map((r) => r.role as Role);
    return roles.length ? roles : ["student", "recruiter", "admin"];
  } catch {
    return ["student", "recruiter", "admin"];
  }
}

export function homeFor(roles: Role[]): "/admin" | "/recruiter" | "/student" {
  const active = getActiveRole();
  if (roles.includes(active)) return `/${active}`;
  if (roles.includes("student")) return "/student";
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("recruiter")) return "/recruiter";
  return "/student";
}

export interface MatchInput {
  studentSkillIds: Set<string>;
  cgpa: number;
  backlogs: number;
  branch: string;
}
export interface JobLike {
  min_cgpa: number;
  max_backlogs: number;
  eligible_branches: string[];
  skills: { id: string; name: string }[];
}

export function computeMatch(s: MatchInput, j: JobLike) {
  const matched = j.skills.filter((k) => s.studentSkillIds.has(k.id));
  const missing = j.skills.filter((k) => !s.studentSkillIds.has(k.id));
  const coverage = j.skills.length ? matched.length / j.skills.length : 1;
  const reasons: string[] = [];
  const blockers: string[] = [];
  if (!j.eligible_branches.includes(s.branch)) blockers.push(`${s.branch} is not an eligible branch`);
  if (s.cgpa < Number(j.min_cgpa)) blockers.push(`CGPA ${s.cgpa} is below the ${j.min_cgpa} cutoff`);
  else reasons.push(`CGPA ${s.cgpa} meets the ${j.min_cgpa} cutoff`);
  if (s.backlogs > j.max_backlogs) blockers.push(`${s.backlogs} backlogs exceed the limit of ${j.max_backlogs}`);
  if (matched.length) reasons.push(`You have ${matched.map((m) => m.name).join(", ")}`);
  const academic = Math.min(1, Math.max(0, (s.cgpa - Number(j.min_cgpa) + 2) / 4));
  let score = Math.round(coverage * 65 + academic * 25 + (blockers.length ? 0 : 10));
  if (blockers.length) score = Math.min(score, 45);
  return { score, matched, missing, reasons, blockers, eligible: blockers.length === 0 };
}

export function computeReadiness(p: {
  cgpa: number;
  backlogs: number;
  skills: number;
  projects: number;
  certs: number;
  verifiedDocs: number;
}) {
  const parts = [
    { label: "Academics", value: Math.round((p.cgpa / 10) * 35), max: 35 },
    { label: "Skills", value: Math.round((Math.min(p.skills, 8) / 8) * 30), max: 30 },
    { label: "Projects", value: Math.min(p.projects, 2) * 7, max: 14 },
    { label: "Certifications", value: Math.min(p.certs, 2) * 4, max: 8 },
    { label: "Documents", value: Math.min(p.verifiedDocs, 2) * 4, max: 8 },
    { label: "No backlogs", value: p.backlogs === 0 ? 5 : 0, max: 5 },
  ];
  return { total: parts.reduce((a, b) => a + b.value, 0), parts };
}

export const statusStyles: Record<string, string> = {
  applied: "bg-secondary text-secondary-foreground",
  shortlisted: "bg-accent/15 text-accent",
  interview: "bg-warning/20 text-foreground",
  offered: "bg-success/15 text-success",
  joined: "bg-success text-primary-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

export const BRANCHES = ["CSE", "IT", "ECE", "EE", "ME"];
