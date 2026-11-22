# Skill to Hire readiness and Phase 2 status

**Last checked:** 2026-11-04

## Summary

This pass added safe, code-supported workflow improvements without assuming deployed database permissions:

- Student profile editing now updates only the signed-in student's `profiles` row fields represented by the current generated types (`full_name`, `branch`, `graduation_year`) and reports when RLS filters out the update.
- Student application pages surface query errors; the dashboard counts only opportunities whose deadline has not passed.
- Recruiter job, application, interview, offer, and candidate pages surface query failures and detect zero-row updates instead of reporting success.
- Recruiter job creation no longer uses the fallback company ID `c1` or shows seeded salary/skills/eligibility values in unsupported fields.
- Recruiter application controls no longer mark an application interviewed or offered without the corresponding record operation. Candidate sort choices use real fields; joining is exposed only for an accepted offer.
- Admin and Student placement-drive pages now share a read-only query against the existing typed `placement_drives` relation. Admin drive counts are query-derived. Drive writes remain unavailable pending deployed RLS verification.
- Added an OpenAI-backed resume analysis Edge Function and Student UI. The function checks the Supabase session and `profiles.role`, requires explicit consent, uses only a publishable Supabase key, validates each extracted skill against a resume quote, limits input/output, handles provider rate limits, and does not persist or log resume text.
- UI copy now distinguishes the repository's generated types from the deployed database.

The shared browser is **not authenticated**. Navigating to `/admin/drives` redirects to `/auth?redirect=%2Fadmin%2Fdrives`. Consequently, no production data, role assignment, RLS policy, or database write has been verified.

The AI function is implemented but not deployed or exercised: no OpenAI secret is configured, and the Deno/Supabase CLIs are unavailable in this environment.

## Feature status

| Feature | Implementation status | Live database status | Testing status | Remaining blocker |
|---|---|---|---|---|
| Auth and `profiles.role` routing | Supabase Auth flow and role-derived protected routes exist | Current role cannot be read without an authenticated session | Unauthenticated redirect verified; Auth page reload had no console/page errors or failed responses | Genuine Admin, Student, and Recruiter sessions unavailable |
| Student dashboard | Uses live profile, opportunity, application, notification, interview, and offer queries; available-opportunity count excludes expired deadlines | Deployed rows and RLS are unverified | Code/build checks only | Genuine Student session |
| Student profile | Read and edit for name, branch, graduation year; email and role remain read-only | Update relies on existing RLS; deployed permission unverified | No update attempted | Genuine Student session and confirmation that policy permits update |
| Student opportunities and applications | Reads records; search/filter and application submission exist; current list prevents applying again when an existing application is visible | Deployed rows, duplicate constraint, and write policy are unverified | No application submitted | Genuine Student session; atomic duplicate prevention requires verifying the deployed unique constraint/policy |
| Student notifications | Reads own profile's notifications and can mark them read; zero-row updates are reported | Deployed rows and update policy are unverified | No write attempted | Genuine Student session |
| Student placement drives | Read-only live query using typed relation | Relation and returned rows have not been checked in production | Code/build checks only | Genuine Student session and deployed RLS/schema confirmation |
| Recruiter dashboard and company | Uses the recruiter-company mapping and live opportunity/application data; unsupported metrics are not fabricated | Recruiter assignment, profile visibility, and company policies are unverified | No Recruiter session | Genuine Recruiter session |
| Recruiter job management | Uses supported opportunity fields; fallback company ID and unsupported seeded form values removed | Insert/update policies are unverified | No writes attempted | Genuine Recruiter session and deployed RLS confirmation |
| Recruiter applicants and candidate details | Reads applications and visible profiles; unsupported match/readiness data is not reported | Cross-company RLS and access to related student records are unverified | No Recruiter session | Verify recruiter-to-company scoping in deployed policies |
| Recruiter application statuses | Shortlist/reject actions remain; interview action routes to actual scheduling; joined is offered only for an accepted offer | Status update policy unverified | No writes attempted | Genuine Recruiter session; offer-creation model/unit remains unclear |
| Recruiter interviews and offers | Reads existing records; interview reschedule/cancel and existing-offer status controls surface errors and zero-row updates | Deployed write policies unverified | No writes attempted | Genuine Recruiter session and RLS confirmation |
| Admin dashboard, directories, analytics | Existing queries derive counts, lists, and charts from returned Supabase rows; drive count is separately query-derived | Production row counts and RLS visibility unverified | No Admin session | Genuine Admin session |
| Admin placement drives | Read-only live listing from typed relation | Relation, columns, and Admin select policy unverified in deployed project | Route redirects to sign-in | Genuine Admin session; write policy verification before management actions |
| Admin company changes | Existing create/update UI uses typed company fields; update success now requires a returned row | Deployed Admin write policy unverified | No company change attempted | Genuine Admin session and RLS confirmation |
| Documents and private storage | No upload/download/delete workflow is implemented | Bucket and policies were not inspected | Not tested | Confirm deployed bucket, object-key mapping, ownership, size/type limits, and policies |
| Resume analysis and skill extraction | OpenAI Edge Function and opt-in Student UI implemented; extracted skills require matching resume evidence | Function not deployed; OpenAI secret and model configuration absent | Frontend/build/lint checked; provider call not tested | Configure server-side secrets and deploy; then test with a genuine Student session |
| Career guidance and job matching | General AI guidance is available through the analysis endpoint; no opportunity-specific score is fabricated | Current opportunity/job-skill relationship is not represented in generated types | Not tested against OpenAI | Verify deployed relationship/policies before calculating any role-specific gap or score |

## Generated schema evidence and unresolved mapping

`src/integrations/supabase/types.ts` is the repository's current generated type surface, **not proof of the deployed schema or policies**. The types include:

- `profiles`: `id`, `email`, `full_name`, `role`, `branch`, `graduation_year`, `created_at`.
- `students`: academic/profile fields including `user_id`, `cgpa`, `backlogs`, `batch_year`, `placement_status`, `roll_no`, `tenth_pct`, and `twelfth_pct`.
- `skills`, `student_skills`, `projects`, and `certifications`.
- `jobs` and `job_skills`; `job_skills.job_id` references `jobs.id`.
- `opportunities`: `id`, `company_id`, `title`, `job_type`, `location`, `description`, `deadline`, and `created_at`. The generated `opportunities` type has no `job_id` or skill/eligibility fields and defines no relationship to `jobs`.
- `applications`: `id`, `profile_id`, `opportunity_id`, and `status`; the generated type has no application timestamp or match score.
- `placement_drives`: `id`, `company_id`, `title`, `drive_date`, `venue`, `status`, `created_at`; `company_id` references `companies.id`.
- `documents`: `student_id`, `doc_type`, `status`, `note`, `created_at`; no storage object key is represented.

These are type-level observations only. They do not prove any table, field, foreign key, RPC, RLS policy, or storage bucket is currently deployed. In particular:

- No drive-registration relation is represented in the generated types. Student registration is not implemented.
- `opportunities` cannot be safely joined to `jobs`/`job_skills` from the generated relationships, so eligibility and skill matching are not connected.
- `offers.salary` has no unit in the generated type; offer creation is not added.
- The generated `documents` row has no storage path/object key; private upload/download cannot be safely mapped.
- No admin-settings relation is represented in the current generated types.

## Migrations, Storage, and AI

- **SQL files created:** none.
- **SQL files awaiting approval:** none. A registration migration or other schema change would be premature until the deployed schema is inspected. Do not apply the local Drizzle schema as a substitute for that inspection.
- **Storage setup:** no Supabase Storage calls, signed-download flow, bucket configuration, or storage policy code was found. The deployed bucket name and policy state are unknown; no public bucket or policy was created.
- **AI setup:** `supabase/functions/resume-analysis/index.ts` calls OpenAI server-side. The Edge Function checks the user's JWT through Supabase Auth and checks the `profiles.role` row using the user's bearer token and publishable key; `verify_jwt` is enabled. No service-role key is used. It returns 429 for provider limits, enforces input/output bounds, and does not write or log resume data. The user selected OpenAI and authorized external processing; the Student UI still requires explicit per-request consent.
- **AI environment variables:** configure `OPENAI_API_KEY`, `OPENAI_MODEL`, and comma-separated `ALLOWED_ORIGINS` as Supabase Edge Function secrets. The function also reads Supabase-provided `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`). Never add `OPENAI_API_KEY` to a `VITE_` variable or browser bundle. No key is currently set.
- **AI deployment:** after configuring those secrets and verifying the allowed origins, run `supabase functions deploy resume-analysis`. The `supabase` and `deno` CLIs are not installed here, so deployment and Deno type-checking were not run.
- **AI limits:** extracted skills must have an exact case-insensitive quote in the submitted text. Recommendations are explicitly non-verified guidance. Opportunity matching and skill gaps remain unavailable until deployed data mappings are confirmed.
- **Remaining mock/local persistence:** no role route directly imports the legacy admin fixture service. Legacy sample/helper modules remain in `src/lib/admin-data.ts`, `src/lib/mock-data.ts`, and `src/lib/recruiter-frontend.ts`; they were retained and are not used by current live route data queries. Supabase auth persistence/local cache in `auth-store.ts` and `previewAuthStorage.ts` is session handling, not application-data persistence.

## Browser and validation results

| Check | Result |
|---|---|
| Browser URL after protected-route test | Redirected to `/auth?redirect=%2Fadmin%2Fdrives`; no genuine session |
| Browser console/page errors during the unauthenticated route test | None observed |
| Failed HTTP responses during the unauthenticated route test | None observed |
| Authenticated Student / Recruiter / Admin pages and live Supabase data | Not tested; genuine sessions unavailable |
| Supabase/RLS errors and production schema | Not testable without an authenticated session and deployed-schema access |
| Database writes | None attempted |
| `npm run build` | Pass |
| `npx tsc --noEmit` | Pass |
| `npm run lint` | Pass; four existing `react-refresh/only-export-components` warnings in `form.tsx`, `navigation-menu.tsx`, `sidebar.tsx`, and `toggle.tsx` |

The Vite build also prints its existing `vite-tsconfig-paths` configuration advisory; the build succeeds.

## Files changed in the implementation

This phase edited:

- `src/lib/student-data.ts`
- `src/routes/_authenticated/admin.analytics.tsx`
- `src/routes/_authenticated/admin.companies.tsx`
- `src/routes/_authenticated/admin.drives.tsx`
- `src/routes/_authenticated/admin.index.tsx`
- `src/routes/_authenticated/admin.interviews.tsx`
- `src/routes/_authenticated/admin.settings.tsx`
- `src/routes/_authenticated/admin.students.tsx`
- `src/routes/_authenticated/recruiter.applications.tsx`
- `src/routes/_authenticated/recruiter.candidate.$candidateId.tsx`
- `src/routes/_authenticated/recruiter.company.tsx`
- `src/routes/_authenticated/recruiter.dashboard.tsx`
- `src/routes/_authenticated/recruiter.discover.tsx`
- `src/routes/_authenticated/recruiter.interviews.tsx`
- `src/routes/_authenticated/recruiter.jobs.tsx`
- `src/routes/_authenticated/recruiter.new-job.tsx`
- `src/routes/_authenticated/recruiter.offers.tsx`
- `src/routes/_authenticated/student.applications.tsx`
- `src/routes/_authenticated/student.drives.tsx`
- `src/routes/_authenticated/student.index.tsx`
- `src/routes/_authenticated/student.insights.tsx`
- `src/routes/_authenticated/student.opportunities.tsx`
- `src/routes/_authenticated/student.profile.tsx`
- `supabase/config.toml`
- `supabase/functions/resume-analysis/index.ts`
- `PROJECT_READINESS_REPORT.md`

Earlier changes retained for this task:

- `src/routes/_authenticated/route.tsx`
- `src/routes/index.tsx`

No unrelated worktree changes were reverted.

## Next actions needed

1. Authenticate genuine Admin, Student, and Recruiter accounts directly in the shared browser; never share passwords or tokens.
2. Verify deployed tables, columns, relationships, and policies with the Supabase project owner before attempting writes, schema changes, storage setup, or drive registration.
3. Confirm the recruiter company mapping and cross-company RLS. Confirm application uniqueness before claiming duplicate prevention is atomic.
4. Configure the OpenAI secrets above and deploy the Edge Function; then test it with a genuine Student account. Use only a server-side `OPENAI_API_KEY`.
