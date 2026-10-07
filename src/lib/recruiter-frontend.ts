import { type MockApplication, type MockCompany, type MockJob, getCompanyById, getMockApplications, getMockJobs } from "@/lib/mock-data";
import { computeMatch } from "@/lib/campus";

export type RecruiterStatus = "open" | "closed" | "draft";
export type ApplicationStatus = "applied" | "shortlisted" | "interview" | "offered" | "joined" | "rejected";
export type OfferStatus = "released" | "accepted" | "declined" | "pending";

export interface RecruiterCompanyProfile extends MockCompany {
  company_size: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  logo?: string;
}

export interface JobDraft {
  title: string;
  description: string;
  location: string;
  job_type: string;
  ctc_lpa: number;
  salary_range?: string;
  required_skills: string[];
  preferred_skills: string[];
  min_cgpa: number;
  eligible_branches: string[];
  max_backlogs: number;
  deadline: string;
  openings: number;
  status: RecruiterStatus;
}

export interface CandidateSummary {
  id: string;
  full_name: string;
  branch: string;
  cgpa: number;
  backlogs: number;
  placement_status: string;
  readiness: number;
  skills: { id: string; name: string; level?: number }[];
  projects: number;
  certifications: number;
  documents: number;
  email: string;
  phone: string | undefined;
  bio: string | undefined;
  availability: string | undefined;
  experience: string | undefined;
  location: string | undefined;
  student_skills: { skill_id: string }[];
}

export const RECRUITER_STATUS_STYLES: Record<string, string> = {
  open: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
  draft: "bg-warning/20 text-warning-foreground",
  applied: "bg-secondary text-secondary-foreground",
  shortlisted: "bg-accent/15 text-accent",
  interview: "bg-warning/20 text-warning-foreground",
  offered: "bg-success/15 text-success",
  joined: "bg-success text-primary-foreground",
  rejected: "bg-destructive/10 text-destructive",
  released: "bg-accent/15 text-accent",
  accepted: "bg-success/15 text-success",
  declined: "bg-muted text-muted-foreground",
  pending: "bg-warning/20 text-warning-foreground",
};

export const RECRUITER_STAT_LABELS: Record<string, string> = {
  applied: "New applications",
  shortlisted: "Shortlisted",
  interview: "Interviews scheduled",
  offered: "Offers made",
  joined: "Joined",
  rejected: "Rejected",
};

export function toDateInputValue(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);
}

export function formatDate(value: string | null | undefined, fallback = "TBD"): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatDateTime(value: string | null | undefined, fallback = "TBD"): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function getDefaultCompanyProfile(): RecruiterCompanyProfile {
  const company = getCompanyById("c1");
  return {
    ...company,
    company_size: "201-500 employees",
    contact_name: "Aisha Verma",
    contact_email: "aisha.verma@novatek.example.com",
    contact_phone: "+91 98765 43210",
    website: company.website || "https://novatek.example.com",
    description: company.description || "Technology company building enterprise software platforms.",
  };
}

export function getStoredCompanyProfile(): RecruiterCompanyProfile {
  if (typeof window === "undefined") return getDefaultCompanyProfile();
  try {
    const saved = window.localStorage.getItem("campuslink_recruiter_company");
    return saved ? { ...getDefaultCompanyProfile(), ...JSON.parse(saved) } : getDefaultCompanyProfile();
  } catch {
    return getDefaultCompanyProfile();
  }
}

export function saveCompanyProfile(profile: RecruiterCompanyProfile): RecruiterCompanyProfile {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("campuslink_recruiter_company", JSON.stringify(profile));
  }
  return profile;
}

export function getRecruiterJobs(): MockJob[] {
  return getMockJobs().filter((job) => job.company_id === "c1" || job.company_id === "c2" || job.company_id === "c4");
}

export function buildDashboardData() {
  const jobs = getRecruiterJobs();
  const applications = getMockApplications().filter((application) => jobs.some((job) => job.id === application.job_id));
  const interviews = applications.flatMap((application) => application.interviews.map((interview) => ({
    ...interview,
    application,
    job: application.job,
  })));
  const offers = applications.flatMap((application) => application.offers.map((offer) => ({
    ...offer,
    application,
    job: application.job,
  })));

  return {
    jobs,
    applications,
    interviews,
    offers,
    activeJobs: jobs.filter((job) => job.status === "open").length,
    totalApplicants: applications.length,
    shortlisted: applications.filter((application) => ["shortlisted", "interview", "offered", "joined"].includes(application.status)).length,
    interviewsScheduled: applications.filter((application) => application.status === "interview").length,
    offersMade: applications.filter((application) => ["offered", "joined"].includes(application.status)).length,
  };
}

export function getCandidateSummary(student: {
  id: string;
  full_name: string;
  branch: string;
  cgpa: number | string;
  backlogs: number | string;
  placement_status?: string;
  student_skills?: { skill_id: string }[];
  projects?: unknown[];
  certifications?: unknown[];
  documents?: unknown[];
  email: string;
  phone?: string;
  bio?: string;
}): CandidateSummary {
  const skills = student.student_skills
    ?.map((entry) => (entry.skill_id ? { id: entry.skill_id, name: entry.skill_id, level: 4 } : null))
    .filter(Boolean) as CandidateSummary["skills"];
  const readiness = Math.min(100, Math.max(0, Math.round((Number(student.cgpa) / 10) * 40 + (skills.length * 8) + (student.projects?.length ?? 0) * 8 + (student.certifications?.length ?? 0) * 7 + (student.documents?.length ?? 0) * 8)));

  return {
    id: student.id,
    full_name: student.full_name,
    branch: student.branch,
    cgpa: Number(student.cgpa),
    backlogs: Number(student.backlogs ?? 0),
    placement_status: student.placement_status ?? "unplaced",
    readiness,
    skills,
    projects: student.projects?.length ?? 0,
    certifications: student.certifications?.length ?? 0,
    documents: student.documents?.length ?? 0,
    email: student.email,
    phone: student.phone,
    bio: student.bio,
    availability: "Available for campus placements",
    experience: student.projects?.length ? `${student.projects.length} project${student.projects.length === 1 ? "" : "s"}` : "No public projects yet",
    location: "Bengaluru",
    student_skills: student.student_skills ?? [],
  };
}

export function getCandidateMatch(student: CandidateSummary, job: Pick<MockJob, "skills" | "min_cgpa" | "max_backlogs" | "eligible_branches">) {
  const jobSkills = job.skills ?? [];
  const skillIds = new Set(student.student_skills.map((entry) => entry.skill_id));
  const match = computeMatch({
    studentSkillIds: skillIds,
    cgpa: Number(student.cgpa),
    backlogs: Number(student.backlogs),
    branch: student.branch,
  }, {
    min_cgpa: job.min_cgpa,
    max_backlogs: job.max_backlogs,
    eligible_branches: job.eligible_branches,
    skills: jobSkills,
  });
  return {
    ...match,
    gapCount: match.missing.length,
    explanation: match.blockers.length
      ? `The candidate is not eligible due to ${match.blockers.join("; ")}.`
      : `${match.matched.length} of ${jobSkills.length} required skills are matched, with strong academic alignment for this role.`,
  };
}

export const formatStatus = (status: string): string => status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function getJobApplicationSummary(job: MockJob) {
  const applications = job.applications ?? [];
  return {
    newApplications: applications.filter((application) => application.status === "applied").length,
    shortlisted: applications.filter((application) => application.status === "shortlisted").length,
    interview: applications.filter((application) => application.status === "interview").length,
    offered: applications.filter((application) => application.status === "offered").length,
  };
}

export function getStatusLabel(status: string): string {
  return RECRUITER_STAT_LABELS[status] ?? formatStatus(status);
}
