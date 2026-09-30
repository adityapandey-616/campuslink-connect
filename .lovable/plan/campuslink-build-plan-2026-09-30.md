# CAMPUSLINK — Build Plan

AI-powered campus-to-corporate placement platform with three roles: Student, Recruiter, Placement Admin. Built in phases so each one is usable before the next starts.

## Design direction
Professional CareerTech look: warm off-white background, deep ink-navy text, one accent (signal teal), IBM Plex Sans + Space Grotesk headings, crisp 8px-radius cards, subtle borders, no heavy gradients or glass effects. Dense, dashboard-grade layouts with a left sidebar per role.

## Phase 1 — Foundation (this turn)
- Enable Lovable Cloud (database, auth, storage).
- Email/password auth: sign up with role choice (Student / Recruiter / Admin request), confirm password, email verification, login, logout, forgot + reset password.
- Roles in a separate table; role-gated areas (`/student/*`, `/recruiter/*`, `/admin/*`). Admin role granted only by an existing admin.
- Premium landing page with the spec's hero copy, features, workflow, stats, CTA.
- Core database: profiles, students, academic records, skills, student skills, projects, certifications, companies, recruiters, jobs, eligibility criteria, placement drives, applications, interviews, offers, documents, notifications, readiness scores, match scores, audit logs — with foreign keys, indexes, status fields and RLS.
- Demo data: 20+ students, 6 companies, 12 jobs, drives, applications, interviews, offers, notifications.

## Phase 2 — Student experience
- Dashboard (readiness score, matched jobs, upcoming interviews, notifications).
- Profile editor: academics, skills, projects, certifications, resume upload.
- Skill-gap analysis and readiness score (rule-based + AI explanation via Lovable AI).
- Opportunities list with match %, "Why you match" and "Skill gaps"; job detail; apply; application tracker; offers and documents.

## Phase 3 — Recruiter portal
- Company profile, create/edit jobs with eligibility, candidate discovery ranked by match score, shortlist, schedule interviews, release offers.

## Phase 4 — Placement Admin
- Analytics dashboard (placement rate, branch-wise, company-wise, package stats) with charts.
- Manage drives, verify documents, students requiring attention, audit log.

## Phase 5 — Polish
- Empty/loading/error states everywhere, mobile layouts, SEO metadata, end-to-end checks of each role journey.

## Technical notes
- TanStack Start routes with the managed `_authenticated` gate plus per-role nested layouts checking `has_role`.
- Server functions with auth middleware for all private reads/writes; matching and readiness computed server-side; AI summaries through Lovable AI.
- Resumes/offer letters in private storage buckets with owner + admin policies.
