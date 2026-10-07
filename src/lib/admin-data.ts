import {
  MOCK_ALL_STUDENTS,
  MOCK_COMPANIES,
  SEED_DRIVES,
  SEED_JOBS,
  getCompanyById,
  getJobById,
  getMockApplications,
  getMockDrives,
  getMockJobs,
  getMockNotifications,
  type MockCandidate,
  type MockCompany,
  type MockDrive,
  type MockJob,
  type MockNotification,
} from "./mock-data";
import { computeMatch, computeReadiness } from "./campus";

export interface AdminCompany extends MockCompany {
  recruiter_name: string;
  recruiter_email: string;
  recruiter_phone: string;
  status: "active" | "under_review" | "inactive";
  tier: "Tier 1 (Dream)" | "Tier 2 (Core)" | "Tier 3 (Mass)";
  registered_at: string;
}

export interface AdminDriveDetail extends MockDrive {
  job_id?: string | undefined;
  drive_time: string;
  mode: "In-Person" | "Virtual" | "Hybrid";
  min_cgpa: number;
  eligible_branches: string[];
  max_backlogs: number;
  deadline: string;
  description: string;
  registered_count?: number | undefined;
  shortlisted_count?: number | undefined;
}

export interface AdminInterviewItem {
  id: string;
  application_id: string;
  student_id: string;
  student_name: string;
  student_branch: string;
  student_roll: string;
  student_cgpa: number;
  company_id: string;
  company_name: string;
  job_id: string;
  job_title: string;
  round: string;
  scheduled_at: string;
  mode: string;
  location: string;
  status: "scheduled" | "completed" | "cancelled" | "cleared";
  has_conflict?: boolean | undefined;
  conflict_reason?: string | undefined;
}

export interface AdminOfferItem {
  id: string;
  application_id: string;
  student_id: string;
  student_name: string;
  student_branch: string;
  student_roll: string;
  company_id: string;
  company_name: string;
  job_title: string;
  ctc_lpa: number;
  offer_date: string;
  joining_date: string | null;
  offer_status: "released" | "accepted" | "declined" | "revoked";
  joining_status: "pending" | "joined" | "deferred" | "reneged";
}

export interface AdminDocumentItem {
  id: string;
  student_id: string;
  student_name: string;
  student_branch: string;
  student_roll: string;
  doc_type: string;
  status: "pending" | "verified" | "rejected";
  file_url: string;
  submitted_at: string;
  rejection_reason?: string | undefined;
  reviewed_at?: string | undefined;
}

export interface AdminSettings {
  officer_name: string;
  officer_id: string;
  officer_email: string;
  officer_phone: string;
  office_location: string;
  institution_name: string;
  academic_year: string;
  placement_season: string;
  max_applications_per_student: number;
  min_attendance_pct: number;
  auto_shortlist_threshold: number;
  allow_multiple_offers: boolean;
  notify_email_digest: boolean;
  notify_conflict_alerts: boolean;
  notify_drive_reminders: boolean;
}

// ----------------------------------------------------
// Persistent Local Store Helper
// ----------------------------------------------------

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(`campuslink_admin_${key}`);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`campuslink_admin_${key}`, JSON.stringify(value));
  } catch {}
}

// ----------------------------------------------------
// Base Seed Data for Admin
// ----------------------------------------------------

const SEED_ADMIN_COMPANIES: AdminCompany[] = [
  {
    ...MOCK_COMPANIES[0],
    id: "c1",
    name: "Novatek Systems",
    industry: "Enterprise Software",
    location: "Bengaluru",
    website: "https://novatek.example.com",
    description: "Enterprise ERP & supply chain microservices provider.",
    recruiter_name: "Priya Sundaram",
    recruiter_email: "priya.s@novatek.example.com",
    recruiter_phone: "+91 98112 34567",
    status: "active",
    tier: "Tier 1 (Dream)",
    registered_at: "2026-08-10",
  },
  {
    ...MOCK_COMPANIES[1],
    id: "c2",
    name: "Quantiva Analytics",
    industry: "Data & AI",
    location: "Hyderabad",
    website: "https://quantiva.example.com",
    description: "Machine learning consultancy and financial forecasting platforms.",
    recruiter_name: "Vikram Sen",
    recruiter_email: "vikram.s@quantiva.example.com",
    recruiter_phone: "+91 98223 45678",
    status: "active",
    tier: "Tier 1 (Dream)",
    registered_at: "2026-08-15",
  },
  {
    ...MOCK_COMPANIES[2],
    id: "c3",
    name: "Orbitrail Mobility",
    industry: "Automotive Tech",
    location: "Pune",
    website: "https://orbitrail.example.com",
    description: "Connected EV firmware and powertrain telemetry systems.",
    recruiter_name: "Ananya Deshmukh",
    recruiter_email: "ananya.d@orbitrail.example.com",
    recruiter_phone: "+91 98334 56789",
    status: "active",
    tier: "Tier 2 (Core)",
    registered_at: "2026-08-20",
  },
  {
    ...MOCK_COMPANIES[3],
    id: "c4",
    name: "Finloop Payments",
    industry: "Fintech",
    location: "Mumbai",
    website: "https://finloop.example.com",
    description: "Real-time UPI settlement rails and multi-currency merchant gateways.",
    recruiter_name: "Rohan Malhotra",
    recruiter_email: "rohan.m@finloop.example.com",
    recruiter_phone: "+91 98445 67890",
    status: "active",
    tier: "Tier 1 (Dream)",
    registered_at: "2026-08-05",
  },
  {
    ...MOCK_COMPANIES[4],
    id: "c5",
    name: "Cloudnest Labs",
    industry: "Cloud Infrastructure",
    location: "Noida",
    website: "https://cloudnest.example.com",
    description: "Kubernetes orchestration and hybrid cloud resilience suite.",
    recruiter_name: "Deepak Kaul",
    recruiter_email: "deepak.k@cloudnest.example.com",
    recruiter_phone: "+91 98556 78901",
    status: "under_review",
    tier: "Tier 2 (Core)",
    registered_at: "2026-09-01",
  },
  {
    ...MOCK_COMPANIES[5],
    id: "c6",
    name: "Medisphere Health",
    industry: "HealthTech",
    location: "Chennai",
    website: "https://medisphere.example.com",
    description: "AI triage and HIPAA-compliant patient management portals.",
    recruiter_name: "Dr. Shalini Raman",
    recruiter_email: "shalini.r@medisphere.example.com",
    recruiter_phone: "+91 98667 89012",
    status: "active",
    tier: "Tier 2 (Core)",
    registered_at: "2026-09-05",
  },
];

const SEED_ADMIN_DRIVES: AdminDriveDetail[] = [
  {
    id: "drv-1",
    company_id: "c1",
    job_id: "j2",
    title: "Novatek Systems Campus Drive",
    drive_date: "2026-10-15",
    drive_time: "09:30 AM",
    venue: "Main Auditorium",
    mode: "In-Person",
    status: "scheduled",
    company: { name: "Novatek Systems" },
    min_cgpa: 7.0,
    eligible_branches: ["CSE", "IT"],
    max_backlogs: 0,
    deadline: "2026-10-12",
    description: "Full-day hiring drive including online test, technical interview, and HR rounds.",
    registered_count: 42,
    shortlisted_count: 14,
  },
  {
    id: "drv-2",
    company_id: "c4",
    job_id: "j1",
    title: "Finloop Payments Placement Drive",
    drive_date: "2026-10-22",
    drive_time: "10:00 AM",
    venue: "Seminar Hall B & Labs",
    mode: "Hybrid",
    status: "scheduled",
    company: { name: "Finloop Payments" },
    min_cgpa: 7.5,
    eligible_branches: ["CSE", "IT"],
    max_backlogs: 0,
    deadline: "2026-10-18",
    description: "Hiring for Backend & Frontend Software Engineers (10 - 12 LPA).",
    registered_count: 58,
    shortlisted_count: 19,
  },
  {
    id: "drv-3",
    company_id: "c2",
    job_id: "j4",
    title: "Quantiva AI Hiring Day",
    drive_date: "2026-09-15",
    drive_time: "11:00 AM",
    venue: "Virtual (Google Meet)",
    mode: "Virtual",
    status: "completed",
    company: { name: "Quantiva Analytics" },
    min_cgpa: 7.0,
    eligible_branches: ["CSE", "IT", "ECE", "ME"],
    max_backlogs: 0,
    deadline: "2026-09-10",
    description: "Special drive for Data Analyst & ML Engineer roles.",
    registered_count: 36,
    shortlisted_count: 8,
  },
  {
    id: "drv-4",
    company_id: "c5",
    job_id: "j5",
    title: "Cloudnest Labs Cloud Drive",
    drive_date: "2026-11-02",
    drive_time: "02:00 PM",
    venue: "Tech Complex Audi",
    mode: "In-Person",
    status: "scheduled",
    company: { name: "Cloudnest Labs" },
    min_cgpa: 7.0,
    eligible_branches: ["CSE", "IT", "ECE"],
    max_backlogs: 1,
    deadline: "2026-10-28",
    description: "DevOps & Cloud Engineer hiring drive.",
    registered_count: 24,
    shortlisted_count: 6,
  },
];

const SEED_ADMIN_OFFERS: AdminOfferItem[] = [
  {
    id: "off-1",
    application_id: "app-off-1",
    student_id: "s2",
    student_name: "Diya Sharma",
    student_branch: "CSE",
    student_roll: "21CS002",
    company_id: "c2",
    company_name: "Quantiva Analytics",
    job_title: "Data Analyst",
    ctc_lpa: 12.0,
    offer_date: "2026-09-20",
    joining_date: "2026-07-01",
    offer_status: "accepted",
    joining_status: "joined",
  },
  {
    id: "off-2",
    application_id: "app-off-2",
    student_id: "s4",
    student_name: "Ishita Rao",
    student_branch: "ECE",
    student_roll: "21EC004",
    company_id: "c3",
    company_name: "Orbitrail Mobility",
    job_title: "Embedded Software Engineer",
    ctc_lpa: 9.0,
    offer_date: "2026-09-28",
    joining_date: "2026-07-15",
    offer_status: "accepted",
    joining_status: "joined",
  },
  {
    id: "off-3",
    application_id: "app-off-3",
    student_id: "s6",
    student_name: "Ananya Iyer",
    student_branch: "IT",
    student_roll: "21IT006",
    company_id: "c5",
    company_name: "Cloudnest Labs",
    job_title: "DevOps Engineer",
    ctc_lpa: 9.5,
    offer_date: "2026-10-01",
    joining_date: "2026-08-01",
    offer_status: "accepted",
    joining_status: "joined",
  },
  {
    id: "off-4",
    application_id: "app-off-4",
    student_id: "s1",
    student_name: "Aarav Mehta",
    student_branch: "CSE",
    student_roll: "21CS001",
    company_id: "c4",
    company_name: "Finloop Payments",
    job_title: "Frontend Engineer",
    ctc_lpa: 10.0,
    offer_date: "2026-10-04",
    joining_date: "2026-07-01",
    offer_status: "released",
    joining_status: "pending",
  },
  {
    id: "off-5",
    application_id: "app-off-5",
    student_id: "s8",
    student_name: "Saanvi Joshi",
    student_branch: "CSE",
    student_roll: "21CS008",
    company_id: "c1",
    company_name: "Novatek Systems",
    job_title: "Software Engineer",
    ctc_lpa: 8.5,
    offer_date: "2026-10-03",
    joining_date: "2026-07-01",
    offer_status: "released",
    joining_status: "pending",
  },
];

const SEED_ADMIN_DOCUMENTS: AdminDocumentItem[] = [
  {
    id: "doc-1",
    student_id: "s3",
    student_name: "Kabir Nair",
    student_branch: "IT",
    student_roll: "21IT003",
    doc_type: "Semester Marksheets (Sem 1-6)",
    status: "pending",
    file_url: "#",
    submitted_at: "2026-10-05T09:30:00Z",
  },
  {
    id: "doc-2",
    student_id: "s5",
    student_name: "Vivaan Gupta",
    student_branch: "CSE",
    student_roll: "21CS005",
    doc_type: "Degree Provisional Certificate",
    status: "pending",
    file_url: "#",
    submitted_at: "2026-10-06T11:15:00Z",
  },
  {
    id: "doc-3",
    student_id: "s10",
    student_name: "Aditya Verma",
    student_branch: "CSE",
    student_roll: "21CS011",
    doc_type: "OBC / Category Certificate",
    status: "pending",
    file_url: "#",
    submitted_at: "2026-10-06T14:45:00Z",
  },
  {
    id: "doc-4",
    student_id: "s1",
    student_name: "Aarav Mehta",
    student_branch: "CSE",
    student_roll: "21CS001",
    doc_type: "Updated Resume (V3)",
    status: "verified",
    file_url: "#",
    submitted_at: "2026-10-02T10:00:00Z",
    reviewed_at: "2026-10-03T16:00:00Z",
  },
  {
    id: "doc-5",
    student_id: "s2",
    student_name: "Diya Sharma",
    student_branch: "CSE",
    student_roll: "21CS002",
    doc_type: "Government ID / Aadhaar Card",
    status: "verified",
    file_url: "#",
    submitted_at: "2026-09-18T12:00:00Z",
    reviewed_at: "2026-09-19T10:30:00Z",
  },
  {
    id: "doc-6",
    student_id: "s7",
    student_name: "Rohan Das",
    student_branch: "ME",
    student_roll: "21ME007",
    doc_type: "Internship Completion Letter",
    status: "rejected",
    file_url: "#",
    submitted_at: "2026-10-01T15:20:00Z",
    rejection_reason: "Document blurry and missing authorized signatory seal.",
    reviewed_at: "2026-10-02T11:00:00Z",
  },
];

const SEED_ADMIN_INTERVIEWS: AdminInterviewItem[] = [
  {
    id: "int-adm-1",
    application_id: "app1",
    student_id: "s1",
    student_name: "Aarav Mehta",
    student_branch: "CSE",
    student_roll: "21CS001",
    student_cgpa: 8.7,
    company_id: "c4",
    company_name: "Finloop Payments",
    job_id: "j1",
    job_title: "Backend Engineer",
    round: "Technical Round 1: System Design",
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) + "T10:00:00",
    mode: "Online",
    location: "Google Meet (meet.google.com/xyz-abc)",
    status: "scheduled",
    has_conflict: false,
  },
  {
    id: "int-adm-2",
    application_id: "app8",
    student_id: "s8",
    student_name: "Saanvi Joshi",
    student_branch: "CSE",
    student_roll: "21CS008",
    student_cgpa: 8.0,
    company_id: "c1",
    company_name: "Novatek Systems",
    job_id: "j2",
    job_title: "Software Engineer",
    round: "Coding & Problem Solving",
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) + "T10:30:00",
    mode: "In-Person",
    location: "Lab Room 302",
    status: "scheduled",
    has_conflict: false,
  },
  {
    id: "int-adm-3",
    application_id: "app1-conflict",
    student_id: "s1",
    student_name: "Aarav Mehta",
    student_branch: "CSE",
    student_roll: "21CS001",
    student_cgpa: 8.7,
    company_id: "c1",
    company_name: "Novatek Systems",
    job_id: "j2",
    job_title: "Software Engineer",
    round: "Round 2 Technical Interview",
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) + "T10:30:00",
    mode: "Online",
    location: "Zoom",
    status: "scheduled",
    has_conflict: true,
    conflict_reason: "Student schedule overlap: Aarav Mehta has Finloop round at 10:00 AM on the same day.",
  },
  {
    id: "int-adm-4",
    application_id: "app3",
    student_id: "s3",
    student_name: "Kabir Nair",
    student_branch: "IT",
    student_roll: "21IT003",
    student_cgpa: 7.4,
    company_id: "c2",
    company_name: "Quantiva Analytics",
    job_id: "j4",
    job_title: "Data Analyst",
    round: "Analytical & SQL Assessment",
    scheduled_at: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10) + "T14:00:00",
    mode: "Online",
    location: "MS Teams",
    status: "scheduled",
    has_conflict: false,
  },
  {
    id: "int-adm-5",
    application_id: "app6",
    student_id: "s6",
    student_name: "Ananya Iyer",
    student_branch: "IT",
    student_roll: "21IT006",
    student_cgpa: 8.9,
    company_id: "c5",
    company_name: "Cloudnest Labs",
    job_id: "j5",
    job_title: "DevOps Engineer",
    round: "Final Culture & Leadership",
    scheduled_at: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10) + "T11:00:00",
    mode: "Online",
    location: "Google Meet",
    status: "cleared",
    has_conflict: false,
  },
];

const SEED_ADMIN_SETTINGS: AdminSettings = {
  officer_name: "Dr. Arvind Chawla",
  officer_id: "TPO-2026-01",
  officer_email: "placements@campuslink.edu",
  officer_phone: "+91 94220 98765",
  office_location: "Training & Placement Cell, Admin Block Room 204",
  institution_name: "National Institute of Technology & Engineering",
  academic_year: "2025-2026",
  placement_season: "Campus Placements 2026 (Phase 1)",
  max_applications_per_student: 5,
  min_attendance_pct: 75,
  auto_shortlist_threshold: 80,
  allow_multiple_offers: true,
  notify_email_digest: true,
  notify_conflict_alerts: true,
  notify_drive_reminders: true,
};

// ----------------------------------------------------
// Public Store Accessors & Mutations
// ----------------------------------------------------

export function getAdminStudents(): MockCandidate[] {
  return readLocal("students", MOCK_ALL_STUDENTS);
}

export function updateAdminStudentStatus(studentId: string, status: string): MockCandidate[] {
  const current = getAdminStudents();
  const updated = current.map((s) => (s.id === studentId ? { ...s, placement_status: status } : s));
  writeLocal("students", updated);
  return updated;
}

export function getAdminCompanies(): AdminCompany[] {
  return readLocal("companies", SEED_ADMIN_COMPANIES);
}

export function updateAdminCompanyStatus(companyId: string, status: AdminCompany["status"]): AdminCompany[] {
  const current = getAdminCompanies();
  const updated = current.map((c) => (c.id === companyId ? { ...c, status } : c));
  writeLocal("companies", updated);
  return updated;
}

export function addAdminCompany(company: Omit<AdminCompany, "id" | "registered_at">): AdminCompany {
  const current = getAdminCompanies();
  const newC: AdminCompany = {
    ...company,
    id: `c-adm-${Date.now()}`,
    registered_at: new Date().toISOString().slice(0, 10),
  };
  writeLocal("companies", [newC, ...current]);
  return newC;
}

export function getAdminDrives(): AdminDriveDetail[] {
  return readLocal("drives_detailed", SEED_ADMIN_DRIVES);
}

export function addAdminDrive(data: Omit<AdminDriveDetail, "id">): AdminDriveDetail {
  const current = getAdminDrives();
  const newDrive: AdminDriveDetail = {
    ...data,
    id: `drv-${Date.now()}`,
    registered_count: data.registered_count ?? 0,
    shortlisted_count: data.shortlisted_count ?? 0,
  };
  const updated = [newDrive, ...current];
  writeLocal("drives_detailed", updated);
  return newDrive;
}

export function updateAdminDrive(driveId: string, updates: Partial<AdminDriveDetail>): AdminDriveDetail[] {
  const current = getAdminDrives();
  const updated = current.map((d) => (d.id === driveId ? { ...d, ...updates } : d));
  writeLocal("drives_detailed", updated);
  return updated;
}

export function deleteAdminDrive(driveId: string): AdminDriveDetail[] {
  const current = getAdminDrives();
  const updated = current.filter((d) => d.id !== driveId);
  writeLocal("drives_detailed", updated);
  return updated;
}

export function getAdminOffers(): AdminOfferItem[] {
  return readLocal("offers", SEED_ADMIN_OFFERS);
}

export function updateAdminOfferStatus(
  offerId: string,
  offer_status: AdminOfferItem["offer_status"],
  joining_status?: AdminOfferItem["joining_status"]
): AdminOfferItem[] {
  const current = getAdminOffers();
  const updated = current.map((o) => {
    if (o.id !== offerId) return o;
    const nextJoining = joining_status ?? (offer_status === "accepted" ? "joined" : o.joining_status);
    return { ...o, offer_status, joining_status: nextJoining };
  });
  writeLocal("offers", updated);

  // If accepted, update student status as placed
  const targetOffer = current.find((o) => o.id === offerId);
  if (targetOffer && offer_status === "accepted") {
    updateAdminStudentStatus(targetOffer.student_id, "placed");
  }

  return updated;
}

export function getAdminDocuments(): AdminDocumentItem[] {
  return readLocal("documents", SEED_ADMIN_DOCUMENTS);
}

export function updateAdminDocumentStatus(
  docId: string,
  status: AdminDocumentItem["status"],
  rejection_reason?: string
): AdminDocumentItem[] {
  const current = getAdminDocuments();
  const updated = current.map((d) =>
    d.id === docId
      ? {
          ...d,
          status,
          rejection_reason: rejection_reason ?? d.rejection_reason,
          reviewed_at: new Date().toISOString(),
        }
      : d
  );
  writeLocal("documents", updated);
  return updated;
}

export function getAdminInterviews(): AdminInterviewItem[] {
  const raw = readLocal("interviews", SEED_ADMIN_INTERVIEWS);
  return checkInterviewConflicts(raw);
}

export function addAdminInterview(data: Omit<AdminInterviewItem, "id" | "has_conflict" | "conflict_reason">): AdminInterviewItem {
  const current = readLocal("interviews", SEED_ADMIN_INTERVIEWS);
  const newInt: AdminInterviewItem = {
    ...data,
    id: `int-${Date.now()}`,
    has_conflict: false,
  };
  const updated = [newInt, ...current];
  const checked = checkInterviewConflicts(updated);
  writeLocal("interviews", checked);
  return newInt;
}

export function updateAdminInterviewStatus(interviewId: string, status: AdminInterviewItem["status"]): AdminInterviewItem[] {
  const current = readLocal("interviews", SEED_ADMIN_INTERVIEWS);
  const updated = current.map((i) => (i.id === interviewId ? { ...i, status } : i));
  const checked = checkInterviewConflicts(updated);
  writeLocal("interviews", checked);
  return checked;
}

export function rescheduleAdminInterview(interviewId: string, newDate: string, newLocation?: string): AdminInterviewItem[] {
  const current = readLocal("interviews", SEED_ADMIN_INTERVIEWS);
  const updated = current.map((i) =>
    i.id === interviewId ? { ...i, scheduled_at: newDate, location: newLocation ?? i.location } : i
  );
  const checked = checkInterviewConflicts(updated);
  writeLocal("interviews", checked);
  return checked;
}

function checkInterviewConflicts(interviews: AdminInterviewItem[]): AdminInterviewItem[] {
  return interviews.map((item, idx) => {
    if (item.status === "completed" || item.status === "cancelled") {
      return { ...item, has_conflict: false, conflict_reason: undefined };
    }
    const itemTime = new Date(item.scheduled_at).getTime();

    // Check conflict against any other active interview
    const conflict = interviews.find((other, otherIdx) => {
      if (idx === otherIdx || other.status === "completed" || other.status === "cancelled") return false;
      const otherTime = new Date(other.scheduled_at).getTime();
      const diffHours = Math.abs(itemTime - otherTime) / (1000 * 60 * 60);

      // Student conflict: same student with interview within 2 hours
      if (item.student_id === other.student_id && diffHours < 2) {
        return true;
      }
      // Venue / slot collision if same location and within 1 hour
      if (item.location && item.location !== "Online" && item.location === other.location && diffHours < 1) {
        return true;
      }
      return false;
    });

    if (conflict) {
      const reason =
        item.student_id === conflict.student_id
          ? `Candidate schedule clash: ${item.student_name} is already booked with ${conflict.company_name} around this time.`
          : `Venue clash at ${item.location} with ${conflict.company_name} interview.`;
      return { ...item, has_conflict: true, conflict_reason: reason };
    }
    return { ...item, has_conflict: false, conflict_reason: undefined };
  });
}

export function getAdminSettings(): AdminSettings {
  return readLocal("settings", SEED_ADMIN_SETTINGS);
}

export function updateAdminSettings(updates: Partial<AdminSettings>): AdminSettings {
  const current = getAdminSettings();
  const next = { ...current, ...updates };
  writeLocal("settings", next);
  return next;
}

// ----------------------------------------------------
// Aggregated Dashboard KPI Helpers
// ----------------------------------------------------

export interface AdminKPISummary {
  totalStudents: number;
  eligibleStudents: number;
  activeCompanies: number;
  activeDrives: number;
  totalApplications: number;
  placedStudents: number;
  placementRate: number;
  pendingDocuments: number;
  upcomingInterviews: number;
  offersReleased: number;
  averageCTC: number;
  highestCTC: number;
}

export function getAdminKPISummary(): AdminKPISummary {
  const students = getAdminStudents();
  const companies = getAdminCompanies();
  const drives = getAdminDrives();
  const apps = getMockApplications();
  const docs = getAdminDocuments();
  const interviews = getAdminInterviews();
  const offers = getAdminOffers();

  const placed = students.filter((s) => s.placement_status === "placed").length;
  const eligible = students.filter((s) => Number(s.cgpa) >= 6.5 && s.backlogs === 0).length;
  const pendingDocs = docs.filter((d) => d.status === "pending").length;
  const activeDrives = drives.filter((d) => d.status === "scheduled" || d.status === "ongoing").length;
  const upcomingInts = interviews.filter((i) => i.status === "scheduled").length;

  const ctcs = offers.map((o) => o.ctc_lpa);
  const avgCTC = ctcs.length ? Number((ctcs.reduce((a, b) => a + b, 0) / ctcs.length).toFixed(1)) : 0;
  const maxCTC = ctcs.length ? Math.max(...ctcs) : 0;

  return {
    totalStudents: students.length,
    eligibleStudents: eligible,
    activeCompanies: companies.filter((c) => c.status === "active").length,
    activeDrives,
    totalApplications: apps.length,
    placedStudents: placed,
    placementRate: students.length ? Math.round((placed / students.length) * 100) : 0,
    pendingDocuments: pendingDocs,
    upcomingInterviews: upcomingInts,
    offersReleased: offers.length,
    averageCTC: avgCTC,
    highestCTC: maxCTC,
  };
}

export function getCandidateEligibilityDetails(student: MockCandidate, job: MockJob) {
  const skillIds = new Set(student.student_skills.map((s) => s.skill_id));
  const readiness = computeReadiness({
    cgpa: Number(student.cgpa),
    backlogs: student.backlogs,
    skills: student.student_skills.length,
    projects: student.projects.length,
    certs: student.certifications.length,
    verifiedDocs: student.documents.filter((d) => d.status === "verified").length,
  });

  const match = computeMatch(
    {
      studentSkillIds: skillIds,
      cgpa: Number(student.cgpa),
      backlogs: student.backlogs,
      branch: student.branch,
    },
    job
  );

  return {
    student,
    job,
    readinessScore: readiness.total,
    matchScore: match.score,
    isEligible: match.eligible,
    reasons: match.reasons,
    blockers: match.blockers,
    matchedSkills: match.matched,
    missingSkills: match.missing,
  };
}
