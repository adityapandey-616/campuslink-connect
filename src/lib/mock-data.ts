export interface MockCompany {
  id: string;
  name: string;
  industry: string;
  location: string;
  website: string;
  description: string;
}

export interface MockSkill {
  id: string;
  name: string;
  category: string;
}

export interface MockStudentSkill extends MockSkill {
  level: number;
}

export interface MockProject {
  id: string;
  student_id: string;
  title: string;
  description: string;
  tech: string;
  created_at: string;
}

export interface MockCert {
  id: string;
  student_id: string;
  name: string;
  issuer: string;
  issued_on: string | null;
  created_at: string;
}

export interface MockDoc {
  id: string;
  student_id: string;
  doc_type: string;
  status: string;
  created_at: string;
}

export interface MockInterview {
  id: string;
  application_id: string;
  round: string;
  scheduled_at: string;
  mode: string;
  location: string;
  status: string;
}

export interface MockOffer {
  id: string;
  application_id: string;
  ctc_lpa: number;
  joining_date: string | null;
  status: string;
}

export interface MockApplication {
  id: string;
  student_id: string;
  job_id: string;
  status: string;
  match_score: number;
  created_at: string;
  student?: {
    id: string;
    full_name: string;
    branch: string;
    cgpa: number;
    backlogs: number;
    email: string;
  };
  job?: MockJob;
  interviews: MockInterview[];
  offers: MockOffer[];
}

export interface MockJob {
  id: string;
  company_id: string;
  title: string;
  job_type: string;
  location: string;
  ctc_lpa: number;
  description: string;
  min_cgpa: number;
  max_backlogs: number;
  eligible_branches: string[];
  deadline: string;
  status: string;
  company: MockCompany;
  skills: { id: string; name: string }[];
  job_skills: { skill: { id: string; name: string } | null }[] | undefined;
  applications: any[] | undefined;
}

export interface MockDrive {
  id: string;
  company_id: string;
  title: string;
  drive_date: string;
  venue: string;
  status: string;
  company: { name: string };
}

export interface MockPendingDoc {
  id: string;
  doc_type: string;
  status: string;
  student: { full_name: string; branch: string };
  created_at: string;
}

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  category: "application" | "interview" | "drive" | "offer" | "system";
  read: boolean;
  created_at: string;
}

// ----------------------------------------------------
// Base Seed Data
// ----------------------------------------------------

export const COMPANIES_BY_ID: Record<string, MockCompany> = {
  c1: { id: "c1", name: "Novatek Systems", industry: "Enterprise Software", location: "Bengaluru", website: "https://novatek.example.com", description: "Builds ERP and workflow platforms for mid-market manufacturers." },
  c2: { id: "c2", name: "Quantiva Analytics", industry: "Data & AI", location: "Hyderabad", website: "https://quantiva.example.com", description: "Analytics consultancy delivering ML solutions for retail and fintech." },
  c3: { id: "c3", name: "Orbitrail Mobility", industry: "Automotive Tech", location: "Pune", website: "https://orbitrail.example.com", description: "Connected-vehicle and embedded firmware for EV makers." },
  c4: { id: "c4", name: "Finloop Payments", industry: "Fintech", location: "Mumbai", website: "https://finloop.example.com", description: "UPI and card payments infrastructure for merchants." },
  c5: { id: "c5", name: "Cloudnest Labs", industry: "Cloud Infrastructure", location: "Noida", website: "https://cloudnest.example.com", description: "Managed Kubernetes and DevOps tooling." },
  c6: { id: "c6", name: "Medisphere Health", industry: "HealthTech", location: "Chennai", website: "https://medisphere.example.com", description: "Hospital information systems and telehealth." },
};

export const MOCK_COMPANIES: MockCompany[] = Object.values(COMPANIES_BY_ID);

export const SKILLS_BY_ID: Record<string, MockSkill> = {
  sk1: { id: "sk1", name: "Python", category: "Technical" },
  sk2: { id: "sk2", name: "Java", category: "Technical" },
  sk3: { id: "sk3", name: "C++", category: "Technical" },
  sk4: { id: "sk4", name: "JavaScript", category: "Technical" },
  sk5: { id: "sk5", name: "React", category: "Technical" },
  sk6: { id: "sk6", name: "Node.js", category: "Technical" },
  sk7: { id: "sk7", name: "SQL", category: "Technical" },
  sk8: { id: "sk8", name: "Data Structures", category: "Core" },
  sk9: { id: "sk9", name: "Algorithms", category: "Core" },
  sk10: { id: "sk10", name: "Machine Learning", category: "Technical" },
  sk11: { id: "sk11", name: "Cloud (AWS)", category: "Technical" },
  sk12: { id: "sk12", name: "System Design", category: "Core" },
  sk13: { id: "sk13", name: "Communication", category: "Soft" },
  sk14: { id: "sk14", name: "Embedded C", category: "Technical" },
  sk15: { id: "sk15", name: "Data Analysis", category: "Technical" },
  sk16: { id: "sk16", name: "DevOps", category: "Technical" },
};

export const MOCK_SKILLS: MockSkill[] = Object.values(SKILLS_BY_ID);

export const getCompanyById = (id: string): MockCompany =>
  COMPANIES_BY_ID[id] ?? {
    id,
    name: "Campus Partner Company",
    industry: "Information Technology",
    location: "Bengaluru",
    website: "https://example.com",
    description: "Corporate recruitment partner",
  };

export const getSkillById = (id: string): MockSkill =>
  SKILLS_BY_ID[id] ?? { id, name: id, category: "Technical" };

export const getSkillsByIds = (ids: string[]): MockSkill[] =>
  ids.map(getSkillById);

export const SEED_JOBS: MockJob[] = [
  {
    id: "j1",
    company_id: "c4",
    title: "Backend Engineer",
    job_type: "Full-time",
    location: "Mumbai",
    ctc_lpa: 12.0,
    description: "Scale high-throughput payment APIs in Node.js and Postgres.",
    min_cgpa: 7.5,
    max_backlogs: 0,
    eligible_branches: ["CSE", "IT"],
    deadline: "2026-10-30",
    status: "open",
    company: getCompanyById("c4"),
    skills: getSkillsByIds(["sk6", "sk7", "sk12", "sk8"]),
    job_skills: getSkillsByIds(["sk6", "sk7", "sk12", "sk8"]).map((skill) => ({ skill })),
    applications: [],
  },
  {
    id: "j2",
    company_id: "c1",
    title: "Software Engineer",
    job_type: "Full-time",
    location: "Bengaluru",
    ctc_lpa: 8.5,
    description: "Build and maintain core ERP modules in Java and React.",
    min_cgpa: 7.0,
    max_backlogs: 0,
    eligible_branches: ["CSE", "IT"],
    deadline: "2026-10-25",
    status: "open",
    company: getCompanyById("c1"),
    skills: getSkillsByIds(["sk2", "sk5", "sk8", "sk7"]),
    job_skills: getSkillsByIds(["sk2", "sk5", "sk8", "sk7"]).map((skill) => ({ skill })),
    applications: [],
  },
  {
    id: "j3",
    company_id: "c4",
    title: "Frontend Engineer",
    job_type: "Full-time",
    location: "Mumbai",
    ctc_lpa: 10.0,
    description: "Merchant analytics dashboard in modern React and TypeScript.",
    min_cgpa: 7.0,
    max_backlogs: 0,
    eligible_branches: ["CSE", "IT"],
    deadline: "2026-11-05",
    status: "open",
    company: getCompanyById("c4"),
    skills: getSkillsByIds(["sk4", "sk5", "sk13"]),
    job_skills: getSkillsByIds(["sk4", "sk5", "sk13"]).map((skill) => ({ skill })),
    applications: [],
  },
  {
    id: "j4",
    company_id: "c2",
    title: "Data Analyst",
    job_type: "Full-time",
    location: "Hyderabad",
    ctc_lpa: 7.2,
    description: "Turn retail datasets into dashboards and actionable insights.",
    min_cgpa: 7.0,
    max_backlogs: 0,
    eligible_branches: ["CSE", "IT", "ECE", "ME"],
    deadline: "2026-10-20",
    status: "open",
    company: getCompanyById("c2"),
    skills: getSkillsByIds(["sk7", "sk1", "sk15", "sk13"]),
    job_skills: getSkillsByIds(["sk7", "sk1", "sk15", "sk13"]).map((skill) => ({ skill })),
    applications: [],
  },
  {
    id: "j5",
    company_id: "c5",
    title: "DevOps Engineer",
    job_type: "Full-time",
    location: "Noida",
    ctc_lpa: 9.5,
    description: "CI/CD pipelines, container orchestration, and cloud automation.",
    min_cgpa: 7.0,
    max_backlogs: 1,
    eligible_branches: ["CSE", "IT", "ECE"],
    deadline: "2026-11-10",
    status: "open",
    company: getCompanyById("c5"),
    skills: getSkillsByIds(["sk16", "sk11", "sk1"]),
    job_skills: getSkillsByIds(["sk16", "sk11", "sk1"]).map((skill) => ({ skill })),
    applications: [],
  },
  {
    id: "j6",
    company_id: "c6",
    title: "Full Stack Developer",
    job_type: "Full-time",
    location: "Chennai",
    ctc_lpa: 8.0,
    description: "Build clinical portals and patient care workflows across the stack.",
    min_cgpa: 6.8,
    max_backlogs: 0,
    eligible_branches: ["CSE", "IT"],
    deadline: "2026-11-15",
    status: "open",
    company: getCompanyById("c6"),
    skills: getSkillsByIds(["sk5", "sk6", "sk7"]),
    job_skills: getSkillsByIds(["sk5", "sk6", "sk7"]).map((skill) => ({ skill })),
    applications: [],
  },
  {
    id: "j7",
    company_id: "c3",
    title: "Embedded Software Engineer",
    job_type: "Full-time",
    location: "Pune",
    ctc_lpa: 9.0,
    description: "Firmware for electric vehicle battery management systems.",
    min_cgpa: 7.0,
    max_backlogs: 0,
    eligible_branches: ["ECE", "EE"],
    deadline: "2026-11-20",
    status: "open",
    company: getCompanyById("c3"),
    skills: getSkillsByIds(["sk14", "sk3", "sk9"]),
    job_skills: getSkillsByIds(["sk14", "sk3", "sk9"]).map((skill) => ({ skill })),
    applications: [],
  },
  {
    id: "j8",
    company_id: "c2",
    title: "ML Engineer Intern",
    job_type: "Internship",
    location: "Hyderabad",
    ctc_lpa: 4.8,
    description: "Six-month internship training and deploying production ML models.",
    min_cgpa: 8.0,
    max_backlogs: 0,
    eligible_branches: ["CSE", "IT"],
    deadline: "2026-10-18",
    status: "open",
    company: getCompanyById("c2"),
    skills: getSkillsByIds(["sk1", "sk10", "sk8"]),
    job_skills: getSkillsByIds(["sk1", "sk10", "sk8"]).map((skill) => ({ skill })),
    applications: [],
  },
];

export const MOCK_JOBS: MockJob[] = SEED_JOBS;

// Lookup map for O(1) job access without noUncheckedIndexedAccess issues
export const JOBS_BY_ID: Record<string, MockJob> = Object.fromEntries(
  SEED_JOBS.map((j) => [j.id, j])
);

export const getJobById = (id: string): MockJob =>
  JOBS_BY_ID[id] ?? SEED_JOBS[0] ?? {
    id,
    company_id: "c1",
    title: "Position",
    job_type: "Full-time",
    location: "Bengaluru",
    ctc_lpa: 8,
    description: "",
    min_cgpa: 7,
    max_backlogs: 0,
    eligible_branches: ["CSE"],
    deadline: "2026-12-31",
    status: "open",
    company: getCompanyById("c1"),
    skills: [],
    job_skills: [],
    applications: [],
  };

export const SEED_STUDENT = {
  id: "s1",
  user_id: "demo-user-123",
  full_name: "Aarav Mehta",
  email: "aarav.m@demo.campus",
  roll_no: "21CS001",
  branch: "CSE",
  batch_year: 2025,
  cgpa: 8.7,
  backlogs: 0,
  tenth_pct: 92,
  twelfth_pct: 90,
  phone: "+91 98765 43210",
  bio: "Backend-focused computer science undergrad, passionate about distributed systems and cloud microservices.",
  placement_status: "shortlisted",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_STUDENT = SEED_STUDENT;

export const SEED_STUDENT_SKILLS: MockStudentSkill[] = [
  { id: "sk5", name: "React", category: "Technical", level: 4 },
  { id: "sk6", name: "Node.js", category: "Technical", level: 4 },
  { id: "sk7", name: "SQL", category: "Technical", level: 4 },
  { id: "sk8", name: "Data Structures", category: "Core", level: 4 },
  { id: "sk9", name: "Algorithms", category: "Core", level: 4 },
  { id: "sk11", name: "Cloud (AWS)", category: "Technical", level: 3 },
  { id: "sk4", name: "JavaScript", category: "Technical", level: 5 },
  { id: "sk13", name: "Communication", category: "Soft", level: 4 },
];

export const MOCK_STUDENT_SKILLS = SEED_STUDENT_SKILLS;

export const SEED_PROJECTS: MockProject[] = [
  {
    id: "p1",
    student_id: "s1",
    title: "Distributed Rate Limiter",
    description: "High-performance sliding-window rate limiter built with Node.js and Redis cluster, handling 15,000 req/sec.",
    tech: "Node.js, Redis, Docker, TypeScript",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "p2",
    student_id: "s1",
    title: "Campus Placement Portal",
    description: "End-to-end recruitment tracker with AI candidate matching and verified document repository.",
    tech: "React, Tailwind, PostgreSQL, TanStack Router",
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

export const MOCK_PROJECTS = SEED_PROJECTS;

export const SEED_CERTS: MockCert[] = [
  {
    id: "c1",
    student_id: "s1",
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    issued_on: "2024-06-15",
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: "c2",
    student_id: "s1",
    name: "Full Stack Open Certification",
    issuer: "University of Helsinki",
    issued_on: "2024-03-10",
    created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
  },
];

export const MOCK_CERTS = SEED_CERTS;

export const SEED_DOCUMENTS: MockDoc[] = [
  { id: "d1", student_id: "s1", doc_type: "Resume", status: "verified", created_at: new Date().toISOString() },
  { id: "d2", student_id: "s1", doc_type: "Semester Marksheets", status: "verified", created_at: new Date().toISOString() },
];

export const MOCK_DOCUMENTS = SEED_DOCUMENTS;

export const SEED_APPLICATIONS: MockApplication[] = [
  {
    id: "app1",
    student_id: "s1",
    job_id: "j1",
    status: "interview",
    match_score: 86,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    job: getJobById("j1"),
    interviews: [
      {
        id: "int1",
        application_id: "app1",
        round: "Technical Round 1: System Design",
        scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        mode: "Online",
        location: "Google Meet",
        status: "scheduled",
      },
    ],
    offers: [],
  },
  {
    id: "app2",
    student_id: "s1",
    job_id: "j2",
    status: "shortlisted",
    match_score: 79,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    job: getJobById("j2"),
    interviews: [],
    offers: [],
  },
  {
    id: "app3",
    student_id: "s1",
    job_id: "j3",
    status: "offered",
    match_score: 91,
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    job: getJobById("j3"),
    interviews: [
      {
        id: "int2",
        application_id: "app3",
        round: "Final Culture & HR Round",
        scheduled_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        mode: "Online",
        location: "Zoom",
        status: "completed",
      },
    ],
    offers: [
      {
        id: "off1",
        application_id: "app3",
        ctc_lpa: 10.0,
        joining_date: "2026-07-01",
        status: "released",
      },
    ],
  },
];

export const MOCK_APPLICATIONS = SEED_APPLICATIONS;

export interface MockCandidate {
  id: string;
  full_name: string;
  email: string;
  roll_no: string;
  branch: string;
  batch_year: number;
  cgpa: number;
  backlogs: number;
  placement_status: string;
  student_skills: { skill_id: string }[];
  projects: Array<{ id: string; title?: string; description?: string; tech?: string }>;
  certifications: Array<{ id: string; name?: string; issuer?: string }>;
  documents: Array<{ status: string }>;
  applications: Array<{ id: string }>;
  phone?: string;
  bio?: string;
  tenth_pct?: number;
  twelfth_pct?: number;
}

export const MOCK_ALL_STUDENTS: MockCandidate[] = [
  { id: "s1", full_name: "Aarav Mehta", email: "aarav.m@demo.campus", roll_no: "21CS001", branch: "CSE", batch_year: 2025, cgpa: 8.7, backlogs: 0, placement_status: "shortlisted", student_skills: [{ skill_id: "sk5" }, { skill_id: "sk6" }, { skill_id: "sk7" }, { skill_id: "sk8" }, { skill_id: "sk11" }], projects: [{ id: "p1", title: "Distributed Rate Limiter", description: "High-performance sliding-window rate limiter built with Node.js and Redis.", tech: "Node.js, Redis, Docker, TypeScript" }, { id: "p2", title: "Campus Placement Portal", description: "End-to-end recruitment tracker with AI candidate matching.", tech: "React, Tailwind, PostgreSQL, TanStack Router" }], certifications: [{ id: "c1", name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services" }], documents: [{ status: "verified" }, { status: "verified" }], applications: [{ id: "app1" }, { id: "app2" }], phone: "+91 98765 43210", bio: "Backend-focused computer science undergrad, passionate about distributed systems and cloud microservices.", tenth_pct: 92, twelfth_pct: 90 },
  { id: "s2", full_name: "Diya Sharma", email: "diya.s@demo.campus", roll_no: "21CS002", branch: "CSE", batch_year: 2025, cgpa: 9.1, backlogs: 0, placement_status: "placed", student_skills: [{ skill_id: "sk1" }, { skill_id: "sk10" }, { skill_id: "sk7" }, { skill_id: "sk8" }, { skill_id: "sk9" }], projects: [{ id: "p3" }], certifications: [{ id: "c2" }], documents: [{ status: "verified" }], applications: [{ id: "app4" }] },
  { id: "s3", full_name: "Kabir Nair", email: "kabir.n@demo.campus", roll_no: "21IT003", branch: "IT", batch_year: 2025, cgpa: 7.4, backlogs: 0, placement_status: "unplaced", student_skills: [{ skill_id: "sk4" }, { skill_id: "sk5" }, { skill_id: "sk13" }], projects: [{ id: "p4" }], certifications: [], documents: [{ status: "pending" }], applications: [{ id: "app5" }] },
  { id: "s4", full_name: "Ishita Rao", email: "ishita.r@demo.campus", roll_no: "21EC004", branch: "ECE", batch_year: 2025, cgpa: 8.2, backlogs: 0, placement_status: "placed", student_skills: [{ skill_id: "sk14" }, { skill_id: "sk3" }, { skill_id: "sk9" }], projects: [{ id: "p5" }], certifications: [{ id: "c3" }], documents: [{ status: "verified" }], applications: [{ id: "app6" }] },
  { id: "s5", full_name: "Vivaan Gupta", email: "vivaan.g@demo.campus", roll_no: "21CS005", branch: "CSE", batch_year: 2025, cgpa: 6.4, backlogs: 2, placement_status: "unplaced", student_skills: [{ skill_id: "sk11" }], projects: [], certifications: [], documents: [{ status: "pending" }], applications: [] },
  { id: "s6", full_name: "Ananya Iyer", email: "ananya.i@demo.campus", roll_no: "21IT006", branch: "IT", batch_year: 2025, cgpa: 8.9, backlogs: 0, placement_status: "placed", student_skills: [{ skill_id: "sk4" }, { skill_id: "sk5" }, { skill_id: "sk6" }, { skill_id: "sk7" }], projects: [{ id: "p6" }, { id: "p7" }], certifications: [{ id: "c4" }], documents: [{ status: "verified" }], applications: [{ id: "app7" }] },
  { id: "s7", full_name: "Rohan Das", email: "rohan.d@demo.campus", roll_no: "21ME007", branch: "ME", batch_year: 2025, cgpa: 7.1, backlogs: 1, placement_status: "unplaced", student_skills: [{ skill_id: "sk1" }, { skill_id: "sk15" }], projects: [{ id: "p8" }], certifications: [], documents: [{ status: "verified" }], applications: [{ id: "app8" }] },
  { id: "s8", full_name: "Saanvi Joshi", email: "saanvi.j@demo.campus", roll_no: "21CS008", branch: "CSE", batch_year: 2025, cgpa: 8.0, backlogs: 0, placement_status: "shortlisted", student_skills: [{ skill_id: "sk8" }, { skill_id: "sk9" }, { skill_id: "sk2" }, { skill_id: "sk7" }], projects: [{ id: "p9" }], certifications: [{ id: "c5" }], documents: [{ status: "verified" }], applications: [{ id: "app9" }] },
  { id: "s9", full_name: "Arjun Pillai", email: "arjun.p@demo.campus", roll_no: "21EE009", branch: "EE", batch_year: 2025, cgpa: 7.6, backlogs: 0, placement_status: "unplaced", student_skills: [{ skill_id: "sk14" }, { skill_id: "sk3" }], projects: [{ id: "p10" }], certifications: [], documents: [{ status: "verified" }], applications: [{ id: "app10" }] },
  { id: "s10", full_name: "Aditya Verma", email: "aditya.v@demo.campus", roll_no: "21CS011", branch: "CSE", batch_year: 2025, cgpa: 5.9, backlogs: 3, placement_status: "unplaced", student_skills: [{ skill_id: "sk8" }], projects: [], certifications: [], documents: [{ status: "pending" }], applications: [] },
];

export const MOCK_ADMIN_APPS = [
  { status: "applied", job: { company: { name: "Novatek Systems" } } },
  { status: "applied", job: { company: { name: "Quantiva Analytics" } } },
  { status: "applied", job: { company: { name: "Finloop Payments" } } },
  { status: "shortlisted", job: { company: { name: "Novatek Systems" } } },
  { status: "shortlisted", job: { company: { name: "Orbitrail Mobility" } } },
  { status: "shortlisted", job: { company: { name: "Cloudnest Labs" } } },
  { status: "interview", job: { company: { name: "Finloop Payments" } } },
  { status: "interview", job: { company: { name: "Medisphere Health" } } },
  { status: "interview", job: { company: { name: "Quantiva Analytics" } } },
  { status: "offered", job: { company: { name: "Finloop Payments" } } },
  { status: "offered", job: { company: { name: "Novatek Systems" } } },
  { status: "joined", job: { company: { name: "Quantiva Analytics" } } },
  { status: "joined", job: { company: { name: "Orbitrail Mobility" } } },
  { status: "joined", job: { company: { name: "Cloudnest Labs" } } },
  { status: "rejected", job: { company: { name: "Novatek Systems" } } },
];

export const MOCK_OFFERS = [
  { id: "o1", ctc_lpa: 12.0, status: "accepted" },
  { id: "o2", ctc_lpa: 10.0, status: "released" },
  { id: "o3", ctc_lpa: 8.5, status: "accepted" },
  { id: "o4", ctc_lpa: 9.0, status: "accepted" },
  { id: "o5", ctc_lpa: 7.2, status: "released" },
  { id: "o6", ctc_lpa: 9.5, status: "accepted" },
];

export const SEED_DRIVES: MockDrive[] = [
  { id: "d1", company_id: "c1", title: "Novatek Systems Campus Drive", drive_date: "2026-10-15", venue: "Main Auditorium", status: "scheduled", company: { name: "Novatek Systems" } },
  { id: "d2", company_id: "c4", title: "Finloop Payments Placement Drive", drive_date: "2026-10-22", venue: "Seminar Hall B", status: "scheduled", company: { name: "Finloop Payments" } },
  { id: "d3", company_id: "c2", title: "Quantiva AI Hiring Day", drive_date: "2026-09-15", venue: "Online", status: "completed", company: { name: "Quantiva Analytics" } },
  { id: "d4", company_id: "c5", title: "Cloudnest Labs Cloud Drive", drive_date: "2026-11-02", venue: "Tech Complex Audi", status: "scheduled", company: { name: "Cloudnest Labs" } },
];

export const MOCK_DRIVES = SEED_DRIVES;

export const SEED_PENDING_DOCS: MockPendingDoc[] = [
  { id: "doc1", doc_type: "Semester Marksheets", status: "pending", student: { full_name: "Kabir Nair", branch: "IT" }, created_at: new Date().toISOString() },
  { id: "doc2", doc_type: "Degree Provisional Certificate", status: "pending", student: { full_name: "Vivaan Gupta", branch: "CSE" }, created_at: new Date().toISOString() },
  { id: "doc3", doc_type: "OBC / Category Certificate", status: "pending", student: { full_name: "Aditya Verma", branch: "CSE" }, created_at: new Date().toISOString() },
];

export const MOCK_PENDING_DOCS = SEED_PENDING_DOCS;

// ----------------------------------------------------
// Persistent Local Demo Store for Client-Side Testing
// ----------------------------------------------------

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(`campuslink_demo_${key}`);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`campuslink_demo_${key}`, JSON.stringify(value));
  } catch {}
}

// Student Store
export function getMockStudent() {
  return readLocal("student", SEED_STUDENT);
}

export function updateMockStudent(updates: Partial<typeof SEED_STUDENT>) {
  const current = getMockStudent();
  const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
  writeLocal("student", updated);
  return updated;
}

// Student Skills Store
export function getMockStudentSkills(): MockStudentSkill[] {
  return readLocal("student_skills", SEED_STUDENT_SKILLS);
}

export function addMockStudentSkill(skillId: string, level = 3): MockStudentSkill[] {
  const current = getMockStudentSkills();
  if (current.some((s) => s.id === skillId)) return current;
  const skill = getSkillById(skillId);
  const updated = [...current, { ...skill, level }];
  writeLocal("student_skills", updated);
  return updated;
}

export function removeMockStudentSkill(skillId: string): MockStudentSkill[] {
  const current = getMockStudentSkills();
  const updated = current.filter((s) => s.id !== skillId);
  writeLocal("student_skills", updated);
  return updated;
}

// Projects Store
export function getMockProjects(): MockProject[] {
  return readLocal("projects", SEED_PROJECTS);
}

export function addMockProject(data: { title: string; tech: string; description?: string }): MockProject[] {
  const current = getMockProjects();
  const newProj: MockProject = {
    id: `proj-${Date.now()}`,
    student_id: "s1",
    title: data.title,
    tech: data.tech,
    description: data.description ?? "",
    created_at: new Date().toISOString(),
  };
  const updated = [newProj, ...current];
  writeLocal("projects", updated);
  return updated;
}

export function removeMockProject(id: string): MockProject[] {
  const current = getMockProjects();
  const updated = current.filter((p) => p.id !== id);
  writeLocal("projects", updated);
  return updated;
}

// Certifications Store
export function getMockCertifications(): MockCert[] {
  return readLocal("certifications", SEED_CERTS);
}

export function addMockCert(data: { name: string; issuer: string; issued_on?: string }): MockCert[] {
  const current = getMockCertifications();
  const newCert: MockCert = {
    id: `cert-${Date.now()}`,
    student_id: "s1",
    name: data.name,
    issuer: data.issuer,
    issued_on: data.issued_on ?? null,
    created_at: new Date().toISOString(),
  };
  const updated = [newCert, ...current];
  writeLocal("certifications", updated);
  return updated;
}

export function removeMockCert(id: string): MockCert[] {
  const current = getMockCertifications();
  const updated = current.filter((c) => c.id !== id);
  writeLocal("certifications", updated);
  return updated;
}

// Documents Store
export function getMockDocuments(): MockDoc[] {
  return readLocal("documents", SEED_DOCUMENTS);
}

export function addMockDocument(docType: string): MockDoc[] {
  const current = getMockDocuments();
  const newDoc: MockDoc = {
    id: `doc-${Date.now()}`,
    student_id: "s1",
    doc_type: docType,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  const updated = [...current, newDoc];
  writeLocal("documents", updated);

  // Also add to pending admin queue
  const currentPending = getMockPendingDocs();
  const student = getMockStudent();
  const pendingItem: MockPendingDoc = {
    id: newDoc.id,
    doc_type: docType,
    status: "pending",
    student: { full_name: student.full_name, branch: student.branch },
    created_at: newDoc.created_at,
  };
  writeLocal("pending_docs", [pendingItem, ...currentPending]);

  return updated;
}

// Jobs Store
export function getMockJobs(): MockJob[] {
  return readLocal("jobs", SEED_JOBS);
}

export function addMockJob(data: {
  title: string;
  company_id?: string;
  job_type: string;
  location: string;
  ctc_lpa: number;
  description: string;
  min_cgpa: number;
  max_backlogs: number;
  eligible_branches: string[];
  deadline?: string | null;
  skill_ids?: string[];
  status?: string;
}): MockJob {
  const current = getMockJobs();
  const compId = data.company_id ?? "c1";
  const skills = getSkillsByIds(data.skill_ids ?? []);
  const newJob: MockJob = {
    id: `job-${Date.now()}`,
    company_id: compId,
    title: data.title,
    job_type: data.job_type,
    location: data.location,
    ctc_lpa: data.ctc_lpa,
    description: data.description,
    min_cgpa: data.min_cgpa,
    max_backlogs: data.max_backlogs,
    eligible_branches: data.eligible_branches,
    deadline: data.deadline ?? "2026-11-30",
    status: data.status ?? "open",
    company: getCompanyById(compId),
    skills,
    job_skills: skills.map((skill) => ({ skill })),
    applications: [],
  };
  writeLocal("jobs", [newJob, ...current]);
  return newJob;
}

export function updateMockJob(jobId: string, updates: Partial<MockJob> & { skill_ids?: string[] }): MockJob | null {
  const current = getMockJobs();
  const index = current.findIndex((job) => job.id === jobId);
  if (index < 0) return null;
  const currentJob = current[index];
  if (!currentJob) return null;

  const nextJob: MockJob = {
    ...currentJob,
    id: updates.id ?? currentJob.id,
    company_id: updates.company_id ?? currentJob.company_id,
    title: updates.title ?? currentJob.title,
    job_type: updates.job_type ?? currentJob.job_type,
    location: updates.location ?? currentJob.location,
    ctc_lpa: updates.ctc_lpa ?? currentJob.ctc_lpa,
    description: updates.description ?? currentJob.description,
    min_cgpa: updates.min_cgpa ?? currentJob.min_cgpa,
    max_backlogs: updates.max_backlogs ?? currentJob.max_backlogs,
    eligible_branches: updates.eligible_branches ?? currentJob.eligible_branches,
    deadline: updates.deadline ?? currentJob.deadline,
    status: updates.status ?? currentJob.status,
    company: updates.company ?? currentJob.company,
    skills: updates.skill_ids ? getSkillsByIds(updates.skill_ids) : currentJob.skills,
    job_skills: updates.job_skills ?? currentJob.job_skills,
    applications: updates.applications ?? currentJob.applications,
  };
  current[index] = nextJob;
  writeLocal("jobs", current);
  return nextJob;
}

// Applications Store
export function getMockApplications(): MockApplication[] {
  const apps = readLocal("applications", SEED_APPLICATIONS);
  const jobs = getMockJobs();
  return apps.map((application) => ({
    ...application,
    student: application.student ?? MOCK_ALL_STUDENTS.find((student) => student.id === application.student_id) ?? {
      id: application.student_id,
      full_name: "Student",
      branch: "CSE",
      cgpa: 0,
      backlogs: 0,
      email: "student@demo.campus",
    },
    job: application.job ?? jobs.find((job) => job.id === application.job_id) ?? getJobById(application.job_id),
  }));
}

export function addMockApplication(jobId: string, matchScore: number): MockApplication {
  const current = getMockApplications();
  const jobs = getMockJobs();
  const job = jobs.find((j) => j.id === jobId) ?? getJobById(jobId);
  const newApp: MockApplication = {
    id: `app-${Date.now()}`,
    student_id: "s1",
    job_id: jobId,
    status: "applied",
    match_score: matchScore,
    created_at: new Date().toISOString(),
    job,
    interviews: [],
    offers: [],
  };
  const updated = [newApp, ...current];
  writeLocal("applications", updated);
  return newApp;
}

export function updateMockApplicationStatus(appId: string, status: string): void {
  const current = getMockApplications();
  const updated = current.map((a) => (a.id === appId ? { ...a, status } : a));
  writeLocal("applications", updated);

  // If status is "joined", update student placement status
  if (status === "joined") {
    updateMockStudent({ placement_status: "placed" });
  }
}

export function addMockInterview(appId: string, data: { round: string; scheduled_at: string; mode: string; location?: string }): void {
  const current = getMockApplications();
  const newInterview: MockInterview = {
    id: `int-${Date.now()}`,
    application_id: appId,
    round: data.round,
    scheduled_at: data.scheduled_at,
    mode: data.mode,
    location: data.location ?? "Online",
    status: "scheduled",
  };
  const updated = current.map((a) =>
    a.id === appId
      ? { ...a, status: "interview", interviews: [...a.interviews, newInterview] }
      : a
  );
  writeLocal("applications", updated);
}

export function addMockOffer(appId: string, data: { ctc_lpa: number; joining_date?: string | null }): void {
  const current = getMockApplications();
  const newOffer: MockOffer = {
    id: `off-${Date.now()}`,
    application_id: appId,
    ctc_lpa: data.ctc_lpa,
    joining_date: data.joining_date ?? null,
    status: "released",
  };
  const updated = current.map((a) =>
    a.id === appId
      ? { ...a, status: "offered", offers: [newOffer] }
      : a
  );
  writeLocal("applications", updated);
}

export function updateMockOfferStatus(offerId: string, status: string): void {
  const current = getMockApplications();
  const updated = current.map((a) => {
    const hasOffer = a.offers.some((o) => o.id === offerId);
    if (!hasOffer) return a;
    return {
      ...a,
      status: status === "accepted" ? "joined" : a.status,
      offers: a.offers.map((o) => (o.id === offerId ? { ...o, status } : o)),
    };
  });
  writeLocal("applications", updated);
  if (status === "accepted") {
    updateMockStudent({ placement_status: "placed" });
  }
}

// Drives Store
export function getMockDrives(): MockDrive[] {
  return readLocal("drives", SEED_DRIVES);
}

export function addMockDrive(data: { company_id: string; title: string; drive_date: string; venue: string }): MockDrive[] {
  const current = getMockDrives();
  const company = getCompanyById(data.company_id);
  const newDrive: MockDrive = {
    id: `drv-${Date.now()}`,
    company_id: data.company_id,
    title: data.title,
    drive_date: data.drive_date,
    venue: data.venue,
    status: "scheduled",
    company: { name: company.name },
  };
  const updated = [newDrive, ...current];
  writeLocal("drives", updated);
  return updated;
}

export function updateMockDriveStatus(driveId: string, status: string): MockDrive[] {
  const current = getMockDrives();
  const updated = current.map((d) => (d.id === driveId ? { ...d, status } : d));
  writeLocal("drives", updated);
  return updated;
}

// Pending Docs Store
export function getMockPendingDocs(): MockPendingDoc[] {
  return readLocal("pending_docs", SEED_PENDING_DOCS);
}

export function updateMockPendingDocStatus(docId: string, status: string): MockPendingDoc[] {
  const current = getMockPendingDocs();
  const updated = current.filter((d) => d.id !== docId);
  writeLocal("pending_docs", updated);

  // Update in student documents as well
  const studentDocs = getMockDocuments();
  const updatedStudentDocs = studentDocs.map((d) => (d.id === docId ? { ...d, status } : d));
  writeLocal("documents", updatedStudentDocs);

  return updated;
}

export function resetMockStore(): void {
  if (typeof window === "undefined") return;
  const keys = ["student", "student_skills", "projects", "certifications", "documents", "jobs", "applications", "drives", "pending_docs", "notifications"];
  keys.forEach((k) => window.localStorage.removeItem(`campuslink_demo_${k}`));
}

// ----------------------------------------------------
// Mock Notifications
// ----------------------------------------------------

export const SEED_NOTIFICATIONS: MockNotification[] = [
  {
    id: "n1",
    title: "Interview Scheduled — Finloop Payments",
    body: "Your Technical Round 1 interview is scheduled for " + new Date(Date.now() + 2 * 86400000).toLocaleDateString() + " via Google Meet.",
    category: "interview",
    read: false,
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: "n2",
    title: "Application Shortlisted — Novatek Systems",
    body: "Congratulations! Your application for Software Engineer has been shortlisted.",
    category: "application",
    read: false,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "n3",
    title: "Offer Letter Released — Finloop Payments",
    body: "You have received an offer of ₹10 LPA from Finloop Payments. Please review and respond.",
    category: "offer",
    read: false,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "n4",
    title: "Placement Drive Reminder — Novatek Systems",
    body: "The Novatek Systems Campus Drive is scheduled on " + new Date(Date.now() + 9 * 86400000).toLocaleDateString() + " at Main Auditorium.",
    category: "drive",
    read: true,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "n5",
    title: "Profile Incomplete",
    body: "Add your resume and communication skills assessment to raise your readiness score.",
    category: "system",
    read: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export function getMockNotifications(): MockNotification[] {
  return readLocal("notifications", SEED_NOTIFICATIONS);
}

export function markNotificationRead(id: string): MockNotification[] {
  const current = getMockNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  writeLocal("notifications", updated);
  return updated;
}

export function markAllNotificationsRead(): MockNotification[] {
  const current = getMockNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  writeLocal("notifications", updated);
  return updated;
}

export function addMockNotification(n: Omit<MockNotification, "id" | "created_at" | "read">): MockNotification[] {
  const current = getMockNotifications();
  const newN: MockNotification = { ...n, id: `notif-${Date.now()}`, read: false, created_at: new Date().toISOString() };
  const updated = [newN, ...current];
  writeLocal("notifications", updated);
  return updated;
}
